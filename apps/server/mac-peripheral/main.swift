// A small CoreBluetooth peripheral (GATT server), launched via `open` as a
// standalone .app by apps/server's BLE layer (see ../src/ble/peripheral.ts).
//
// Why a separate helper app instead of a native Node addon: this mirrors the
// project's existing "mac-wrapper" pattern (see ../mac-wrapper/BurrowServer.app)
// for the same reason — CoreBluetooth needs a real, signed application
// identity to grant Bluetooth permission cleanly.
//
// Why `open` specifically, and why a Unix socket instead of stdio: macOS's
// Bluetooth TCC check only shows its permission prompt (and doesn't just
// hard-crash the process with "attempted to access privacy-sensitive data
// without a usage description") for a process actually launched through
// LaunchServices — a bare subprocess run directly, even one that is
// code-signed and lives inside a proper .app bundle with the right
// Info.plist keys, still crashes immediately. But `open` detaches stdio, so
// there's no pipe left to talk over — hence a Unix domain socket at a fixed,
// well-known path instead, which this process connects to as a client (see
// ../src/ble/peripheral.ts for the server side).
//
// Protocol: one JSON object per line, in both directions. See
// ../src/ble/peripheral.ts for the exact shapes — kept in sync by hand,
// there's no shared schema between Swift and TypeScript here.
//
// Same Nordic UART Service (NUS) UUIDs and chunk/frame format as the mobile
// app's BurrowPeripheral.m and apps/server's scanner.ts (central role), so
// this peripheral is exactly what either of those already knows how to talk
// to — see the comments in those files for why NUS specifically.

import CoreBluetooth
import Foundation

let serviceUUID = CBUUID(string: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
let rxCharUUID = CBUUID(string: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E")  // write: central -> us
let txCharUUID = CBUUID(string: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E")  // notify: us -> central

let writeChunkBytes = 20
let messageDelimiter: UInt8 = 0x0A  // '\n'

// Fixed, well-known path — both sides hardcode it, no need to pass it
// dynamically since there's one Burrow instance per user account.
let socketPath = (NSHomeDirectory() as NSString).appendingPathComponent(".burrow/peripheral.sock")

final class IPC {
  private var fd: Int32 = -1
  private var handle: FileHandle?
  private var source: DispatchSourceRead?
  private var buffer = Data()
  var onLine: ((String) -> Void)?

  func connectWithRetry() {
    fd = socket(AF_UNIX, SOCK_STREAM, 0)
    guard fd >= 0 else { exit(1) }

    var addr = sockaddr_un()
    addr.sun_family = sa_family_t(AF_UNIX)
    let pathBytes = Array(socketPath.utf8)
    withUnsafeMutableBytes(of: &addr.sun_path) { ptr in
      ptr.copyBytes(from: pathBytes.prefix(ptr.count - 1))
    }
    let len = socklen_t(MemoryLayout<sockaddr_un>.size)

    var attempts = 0
    while attempts < 50 {  // ~5s total
      let result = withUnsafePointer(to: &addr) { ptr -> Int32 in
        ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { connect(fd, $0, len) }
      }
      if result == 0 { break }
      attempts += 1
      Thread.sleep(forTimeInterval: 0.1)
    }
    if attempts >= 50 { exit(1) }  // couldn't reach the Node side — nothing useful to do

    let handle = FileHandle(fileDescriptor: fd, closeOnDealloc: true)
    self.handle = handle
    let source = DispatchSource.makeReadSource(fileDescriptor: fd)
    source.setEventHandler { [weak self] in
      guard let self = self else { return }
      let data = handle.availableData
      if data.isEmpty { exit(0) }  // Node side closed the connection — nothing left to do
      self.buffer.append(data)
      while let newlineIndex = self.buffer.firstIndex(of: 0x0A) {
        let lineData = self.buffer.subdata(in: 0..<newlineIndex)
        self.buffer.removeSubrange(0...newlineIndex)
        if !lineData.isEmpty, let line = String(data: lineData, encoding: .utf8) {
          self.onLine?(line)
        }
      }
    }
    source.resume()
    self.source = source
  }

  func send(_ obj: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: obj) else { return }
    var line = data
    line.append(0x0A)
    handle?.write(line)
  }
}

let ipc = IPC()

final class Peripheral: NSObject, CBPeripheralManagerDelegate {
  private var manager: CBPeripheralManager!
  private var rxChar: CBMutableCharacteristic!
  private var txChar: CBMutableCharacteristic!
  private var wantsAdvertising = false
  private var pendingLocalName = "Burrow"
  private var subscribedCentrals: [String: CBCentral] = [:]
  private var recvBuffers: [String: Data] = [:]
  // Chunks -updateValue(...) rejected because CoreBluetooth's internal
  // transmit queue was full — must wait for peripheralManagerIsReadyToUpdateSubscribers
  // before retrying, or the data is silently lost. Same issue (and fix) as
  // BurrowPeripheral.m on the mobile side; see its comments for the details.
  private var pendingChunks: [(chunk: Data, centrals: [CBCentral]?)] = []

  override init() {
    super.init()
    manager = CBPeripheralManager(delegate: self, queue: nil)
  }

  func start(name: String) {
    pendingLocalName = name
    wantsAdvertising = true
    if manager.state == .poweredOn { beginAdvertisingIfReady() }
  }

  func stop() {
    wantsAdvertising = false
    if manager.isAdvertising { manager.stopAdvertising() }
    ipc.send(["type": "advertising", "advertising": false])
  }

  func send(centralId: String, text: String) {
    guard txChar != nil else { return }
    let centrals: [CBCentral]? = subscribedCentrals[centralId].map { [$0] }
    var payload = Data(text.utf8)
    payload.append(messageDelimiter)

    var offset = 0
    while offset < payload.count {
      let end = min(offset + writeChunkBytes, payload.count)
      pendingChunks.append((chunk: payload.subdata(in: offset..<end), centrals: centrals))
      offset = end
    }
    flushPendingChunks()
  }

  private func flushPendingChunks() {
    while !pendingChunks.isEmpty {
      let entry = pendingChunks[0]
      let sent = manager.updateValue(entry.chunk, for: txChar, onSubscribedCentrals: entry.centrals)
      if !sent { return }  // wait for peripheralManagerIsReadyToUpdateSubscribers
      pendingChunks.removeFirst()
    }
  }

  private func beginAdvertisingIfReady() {
    guard wantsAdvertising else { return }

    rxChar = CBMutableCharacteristic(
      type: rxCharUUID,
      properties: [.write, .writeWithoutResponse],
      value: nil,
      permissions: [.writeable]
    )
    txChar = CBMutableCharacteristic(
      type: txCharUUID,
      properties: [.notify],
      value: nil,
      permissions: [.readable]
    )
    let service = CBMutableService(type: serviceUUID, primary: true)
    service.characteristics = [rxChar, txChar]

    manager.removeAllServices()
    manager.add(service)
    // Advertising itself starts once peripheralManager(_:didAdd:error:) confirms.
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    let state: String
    switch peripheral.state {
    case .poweredOn: state = "poweredOn"
    case .poweredOff: state = "poweredOff"
    case .unauthorized: state = "unauthorized"
    case .unsupported: state = "unsupported"
    case .resetting: state = "resetting"
    default: state = "unknown"
    }
    ipc.send(["type": "state", "state": state])
    if peripheral.state == .poweredOn {
      beginAdvertisingIfReady()
    } else {
      rxChar = nil
      txChar = nil
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
    if let error = error {
      ipc.send(["type": "advertising", "advertising": false, "error": error.localizedDescription])
      return
    }
    guard wantsAdvertising else { return }
    manager.startAdvertising([
      CBAdvertisementDataServiceUUIDsKey: [serviceUUID],
      CBAdvertisementDataLocalNameKey: pendingLocalName,
    ])
  }

  func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
    if let error = error {
      ipc.send(["type": "advertising", "advertising": false, "error": error.localizedDescription])
      return
    }
    ipc.send(["type": "advertising", "advertising": true])
  }

  func peripheralManager(
    _ peripheral: CBPeripheralManager, central: CBCentral, didSubscribeTo characteristic: CBCharacteristic
  ) {
    let id = central.identifier.uuidString
    subscribedCentrals[id] = central
    recvBuffers[id] = Data()
    ipc.send(["type": "subscribed", "centralId": id])
  }

  func peripheralManager(
    _ peripheral: CBPeripheralManager, central: CBCentral, didUnsubscribeFrom characteristic: CBCharacteristic
  ) {
    let id = central.identifier.uuidString
    subscribedCentrals.removeValue(forKey: id)
    recvBuffers.removeValue(forKey: id)
    ipc.send(["type": "unsubscribed", "centralId": id])
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
    for request in requests {
      let id = request.central.identifier.uuidString
      var buffer = recvBuffers[id] ?? Data()
      if let value = request.value { buffer.append(value) }

      // Split the accumulated buffer on the message delimiter, emitting one
      // event per complete message and leaving any partial tail buffered.
      var start = 0
      for i in 0..<buffer.count where buffer[i] == messageDelimiter {
        let messageData = buffer.subdata(in: start..<i)
        if let text = String(data: messageData, encoding: .utf8) {
          ipc.send(["type": "message", "centralId": id, "text": text])
        }
        start = i + 1
      }
      if start > 0 { buffer.removeSubrange(0..<start) }
      recvBuffers[id] = buffer

      peripheral.respond(to: request, withResult: .success)
    }
  }

  func peripheralManagerIsReady(toUpdateSubscribers peripheral: CBPeripheralManager) {
    flushPendingChunks()
  }
}

let peripheral = Peripheral()

ipc.onLine = { line in
  guard let data = line.data(using: .utf8),
    let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
    let cmd = obj["cmd"] as? String
  else { return }

  DispatchQueue.main.async {
    switch cmd {
    case "start":
      peripheral.start(name: (obj["name"] as? String) ?? "Burrow")
    case "stop":
      peripheral.stop()
    case "send":
      if let centralId = obj["centralId"] as? String, let text = obj["text"] as? String {
        peripheral.send(centralId: centralId, text: text)
      }
    default:
      break
    }
  }
}
ipc.connectWithRetry()

RunLoop.main.run()
