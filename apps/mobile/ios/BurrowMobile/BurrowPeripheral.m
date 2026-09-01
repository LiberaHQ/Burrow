#import "BurrowPeripheral.h"
#import <CoreBluetooth/CoreBluetooth.h>

// Nordic UART Service (NUS) — same UUIDs as apps/server/src/ble/scanner.ts,
// so this phone's advertised service is exactly what the desktop app's BLE
// central role already knows how to discover and talk to.
static NSString *const kServiceUUID = @"6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
static NSString *const kRxCharUUID = @"6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // write: central -> us
static NSString *const kTxCharUUID = @"6E400003-B5A3-F393-E0A9-E50E24DCCA9E"; // notify: us -> central

// Same framing as the desktop side: messages are chunked to this size on
// send and reassembled on receive by splitting on a trailing newline, since
// a single write/notify can't reliably carry a whole message past the
// (unknown, conservatively small) negotiated ATT MTU.
static const NSUInteger kWriteChunkBytes = 20;
static const uint8_t kMessageDelimiter = '\n';

@interface BurrowPeripheral () <CBPeripheralManagerDelegate>
@property(nonatomic, strong) CBPeripheralManager *peripheralManager;
@property(nonatomic, strong) CBMutableCharacteristic *rxCharacteristic;
@property(nonatomic, strong) CBMutableCharacteristic *txCharacteristic;
@property(nonatomic, strong) NSString *pendingLocalName;
@property(nonatomic, assign) BOOL wantsAdvertising;
@property(nonatomic, strong) NSMutableDictionary<NSString *, CBCentral *> *subscribedCentrals;
@property(nonatomic, strong) NSMutableDictionary<NSString *, NSMutableData *> *recvBuffers;
@property(nonatomic, assign) BOOL hasListeners;
// Chunks that -updateValue:forCharacteristic:onSubscribedCentrals: rejected
// because the peripheral's internal transmit queue was full — CoreBluetooth
// requires waiting for -peripheralManagerIsReadyToUpdateSubscribers: before
// retrying, or the data is just silently lost (no error, no exception).
@property(nonatomic, strong) NSMutableArray<NSDictionary *> *pendingChunks;
@end

@implementation BurrowPeripheral

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    _subscribedCentrals = [NSMutableDictionary new];
    _recvBuffers = [NSMutableDictionary new];
    _pendingChunks = [NSMutableArray new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"onStateChange", @"onAdvertisingStateChange", @"onCentralSubscribed",
    @"onCentralUnsubscribed", @"onMessageReceived"
  ];
}

- (void)startObserving {
  self.hasListeners = YES;
}

- (void)stopObserving {
  self.hasListeners = NO;
}

- (void)emit:(NSString *)name body:(id)body {
  if (self.hasListeners) {
    [self sendEventWithName:name body:body];
  }
}

- (CBPeripheralManager *)peripheralManager {
  if (!_peripheralManager) {
    _peripheralManager = [[CBPeripheralManager alloc] initWithDelegate:self queue:dispatch_get_main_queue()];
  }
  return _peripheralManager;
}

#pragma mark - JS-exported methods

RCT_EXPORT_METHOD(startAdvertising : (NSString *)localName) {
  self.pendingLocalName = localName;
  self.wantsAdvertising = YES;
  // Touch the lazy getter so CBPeripheralManager is created and starts
  // asking for authorization / reporting its state.
  CBPeripheralManager *manager = self.peripheralManager;
  if (manager.state == CBManagerStatePoweredOn) {
    [self beginAdvertisingIfReady];
  }
}

RCT_EXPORT_METHOD(stopAdvertising) {
  self.wantsAdvertising = NO;
  if (self.peripheralManager.isAdvertising) {
    [self.peripheralManager stopAdvertising];
  }
  [self emit:@"onAdvertisingStateChange" body:@{@"advertising" : @NO}];
}

RCT_EXPORT_METHOD(sendMessage : (NSString *)centralId text : (NSString *)text) {
  NSLog(@"[Burrow] sendMessage to %@ (%lu chars), txCharacteristic=%@", centralId, (unsigned long)text.length,
        self.txCharacteristic ? @"present" : @"NIL");
  if (!self.txCharacteristic) return;

  // Target the specific central if we know it (so a message meant for one
  // connected phone doesn't also broadcast to every other one); fall back
  // to broadcasting to everyone subscribed if the id isn't recognized.
  CBCentral *target = self.subscribedCentrals[centralId];
  NSLog(@"[Burrow] sendMessage target central %@ found=%@ (known subscribed: %@)", centralId, target ? @"YES" : @"NO",
        self.subscribedCentrals.allKeys);
  NSArray<CBCentral *> *centrals = target ? @[ target ] : nil;

  NSMutableData *payload = [[text dataUsingEncoding:NSUTF8StringEncoding] mutableCopy];
  uint8_t delimiter = kMessageDelimiter;
  [payload appendBytes:&delimiter length:1];

  [self enqueueChunksOfPayload:payload centrals:centrals];
}

- (void)enqueueChunksOfPayload:(NSData *)payload centrals:(NSArray<CBCentral *> *)centrals {
  NSUInteger offset = 0;
  while (offset < payload.length) {
    NSUInteger length = MIN(kWriteChunkBytes, payload.length - offset);
    NSData *chunk = [payload subdataWithRange:NSMakeRange(offset, length)];
    [self.pendingChunks addObject:@{@"chunk" : chunk, @"centrals" : centrals ?: [NSNull null]}];
    offset += length;
  }
  [self flushPendingChunks];
}

// Drains -pendingChunks via -updateValue:..., stopping (and waiting for
// -peripheralManagerIsReadyToUpdateSubscribers:) the moment CoreBluetooth's
// internal transmit buffer is full, instead of silently dropping chunks.
- (void)flushPendingChunks {
  while (self.pendingChunks.count > 0) {
    NSDictionary *entry = self.pendingChunks.firstObject;
    NSData *chunk = entry[@"chunk"];
    id centralsValue = entry[@"centrals"];
    NSArray<CBCentral *> *centrals = [centralsValue isKindOfClass:[NSNull class]] ? nil : centralsValue;

    BOOL sent = [self.peripheralManager updateValue:chunk forCharacteristic:self.txCharacteristic
                                  onSubscribedCentrals:centrals];
    NSLog(@"[Burrow] updateValue chunk (%lu bytes) sent=%@ (queue depth %lu)", (unsigned long)chunk.length,
          sent ? @"YES" : @"NO (will retry)", (unsigned long)self.pendingChunks.count);
    if (!sent) return; // wait for peripheralManagerIsReadyToUpdateSubscribers:
    [self.pendingChunks removeObjectAtIndex:0];
  }
}

- (void)peripheralManagerIsReadyToUpdateSubscribers:(CBPeripheralManager *)peripheral {
  NSLog(@"[Burrow] peripheralManagerIsReadyToUpdateSubscribers, queue depth %lu",
        (unsigned long)self.pendingChunks.count);
  [self flushPendingChunks];
}

#pragma mark - Setup

- (void)beginAdvertisingIfReady {
  if (!self.wantsAdvertising) return;

  CBUUID *serviceUUID = [CBUUID UUIDWithString:kServiceUUID];

  self.rxCharacteristic = [[CBMutableCharacteristic alloc]
      initWithType:[CBUUID UUIDWithString:kRxCharUUID]
        properties:CBCharacteristicPropertyWrite | CBCharacteristicPropertyWriteWithoutResponse
             value:nil
       permissions:CBAttributePermissionsWriteable];

  self.txCharacteristic = [[CBMutableCharacteristic alloc]
      initWithType:[CBUUID UUIDWithString:kTxCharUUID]
        properties:CBCharacteristicPropertyNotify
             value:nil
       permissions:CBAttributePermissionsReadable];

  CBMutableService *service = [[CBMutableService alloc] initWithType:serviceUUID primary:YES];
  service.characteristics = @[ self.rxCharacteristic, self.txCharacteristic ];

  [self.peripheralManager removeAllServices];
  [self.peripheralManager addService:service];
  // Advertising itself starts once peripheralManager:didAddService: confirms
  // the service was actually registered.
}

#pragma mark - CBPeripheralManagerDelegate

- (void)peripheralManagerDidUpdateState:(CBPeripheralManager *)peripheral {
  NSString *state = [self stateName:peripheral.state];
  [self emit:@"onStateChange" body:@{@"state" : state}];

  if (peripheral.state == CBManagerStatePoweredOn) {
    [self beginAdvertisingIfReady];
  } else {
    self.rxCharacteristic = nil;
    self.txCharacteristic = nil;
  }
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didAddService:(CBService *)service error:(NSError *)error {
  if (error) {
    [self emit:@"onAdvertisingStateChange" body:@{@"advertising" : @NO, @"error" : error.localizedDescription}];
    return;
  }
  if (!self.wantsAdvertising) return;

  NSDictionary *advertisementData = @{
    CBAdvertisementDataServiceUUIDsKey : @[ [CBUUID UUIDWithString:kServiceUUID] ],
    CBAdvertisementDataLocalNameKey : self.pendingLocalName ?: @"Burrow"
  };
  [self.peripheralManager startAdvertising:advertisementData];
}

- (void)peripheralManagerDidStartAdvertising:(CBPeripheralManager *)peripheral error:(NSError *)error {
  if (error) {
    [self emit:@"onAdvertisingStateChange" body:@{@"advertising" : @NO, @"error" : error.localizedDescription}];
    return;
  }
  [self emit:@"onAdvertisingStateChange" body:@{@"advertising" : @YES}];
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral
                   central:(CBCentral *)central
    didSubscribeToCharacteristic:(CBCharacteristic *)characteristic {
  NSString *centralId = central.identifier.UUIDString;
  NSLog(@"[Burrow] didSubscribeToCharacteristic %@ from central %@", characteristic.UUID, centralId);
  self.subscribedCentrals[centralId] = central;
  self.recvBuffers[centralId] = [NSMutableData new];
  [self emit:@"onCentralSubscribed" body:@{@"centralId" : centralId}];
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral
                    central:(CBCentral *)central
    didUnsubscribeFromCharacteristic:(CBCharacteristic *)characteristic {
  NSString *centralId = central.identifier.UUIDString;
  [self.subscribedCentrals removeObjectForKey:centralId];
  [self.recvBuffers removeObjectForKey:centralId];
  [self emit:@"onCentralUnsubscribed" body:@{@"centralId" : centralId}];
}

- (void)peripheralManager:(CBPeripheralManager *)peripheral didReceiveWriteRequests:(NSArray<CBATTRequest *> *)requests {
  for (CBATTRequest *request in requests) {
    NSString *centralId = request.central.identifier.UUIDString;
    NSMutableData *buffer = self.recvBuffers[centralId];
    if (!buffer) {
      buffer = [NSMutableData new];
      self.recvBuffers[centralId] = buffer;
    }
    NSLog(@"[Burrow] didReceiveWriteRequests from %@: %lu bytes (hasListeners=%@)", centralId,
          (unsigned long)request.value.length, self.hasListeners ? @"YES" : @"NO");
    if (request.value) {
      [buffer appendData:request.value];
    }

    // Split the accumulated buffer on the message delimiter, emitting one
    // event per complete message and leaving any partial tail buffered.
    const uint8_t *bytes = buffer.bytes;
    NSUInteger length = buffer.length;
    NSUInteger start = 0;
    for (NSUInteger i = 0; i < length; i++) {
      if (bytes[i] == kMessageDelimiter) {
        NSData *messageData = [buffer subdataWithRange:NSMakeRange(start, i - start)];
        NSString *text = [[NSString alloc] initWithData:messageData encoding:NSUTF8StringEncoding];
        NSLog(@"[Burrow] assembled message from %@: %@", centralId, text);
        if (text) {
          [self emit:@"onMessageReceived" body:@{@"centralId" : centralId, @"text" : text}];
        }
        start = i + 1;
      }
    }
    if (start > 0) {
      [buffer replaceBytesInRange:NSMakeRange(0, start) withBytes:NULL length:0];
    }

    [peripheral respondToRequest:request withResult:CBATTErrorSuccess];
  }
}

#pragma mark - Helpers

- (NSString *)stateName:(CBManagerState)state {
  switch (state) {
    case CBManagerStatePoweredOn:
      return @"poweredOn";
    case CBManagerStatePoweredOff:
      return @"poweredOff";
    case CBManagerStateUnauthorized:
      return @"unauthorized";
    case CBManagerStateUnsupported:
      return @"unsupported";
    case CBManagerStateResetting:
      return @"resetting";
    default:
      return @"unknown";
  }
}

@end
