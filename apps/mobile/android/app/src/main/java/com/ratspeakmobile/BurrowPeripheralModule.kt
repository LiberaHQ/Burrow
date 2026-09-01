package com.ratspeakmobile

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.content.pm.PackageManager
import android.os.ParcelUuid
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Android counterpart to ../../../ios/BurrowMobile/BurrowPeripheral.m — same
 * Nordic UART Service (NUS) UUIDs, same chunk/frame format, same JS-facing
 * event/method contract (see ../../../../src/ble/peripheral.ts), so the
 * shared JS mesh code works unmodified on both platforms.
 *
 * The one thing with no iOS equivalent: BLE peripherals on Android must
 * expose the Client Characteristic Configuration Descriptor (CCCD) on the
 * notify characteristic themselves and handle writes to it — iOS's
 * CBPeripheralManager does this invisibly. See onDescriptorWriteRequest.
 */
class BurrowPeripheralModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private val SERVICE_UUID = UUID.fromString("6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
        private val RX_CHAR_UUID = UUID.fromString("6E400002-B5A3-F393-E0A9-E50E24DCCA9E") // write: central -> us
        private val TX_CHAR_UUID = UUID.fromString("6E400003-B5A3-F393-E0A9-E50E24DCCA9E") // notify: us -> central
        private val CCCD_UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
        private const val WRITE_CHUNK_BYTES = 20
        private const val MESSAGE_DELIMITER: Byte = 0x0A // '\n'
    }

    private val bluetoothManager: BluetoothManager?
        get() = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager

    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    private var txCharacteristic: BluetoothGattCharacteristic? = null
    private var wantsAdvertising = false
    private var pendingLocalName = "Burrow"

    /** BluetoothDevice.address -> device, for centrals currently subscribed to notify. */
    private val subscribedCentrals = ConcurrentHashMap<String, BluetoothDevice>()
    private val recvBuffers = ConcurrentHashMap<String, MutableList<Byte>>()

    // notifyCharacteristicChanged(...) returning false means Android's
    // internal queue is full — same issue (and fix) as CoreBluetooth's
    // updateValue on iOS/macOS; see BurrowPeripheral.m's comment on this for
    // the full story. Retry once onNotificationSent fires for the device.
    private data class PendingChunk(val device: BluetoothDevice, val bytes: ByteArray)
    private val pendingChunks = ConcurrentLinkedQueue<PendingChunk>()
    private var flushing = false

    override fun getName() = "BurrowPeripheral"

    private fun emit(name: String, body: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, body)
    }

    private fun hasPermission(permission: String): Boolean =
        ContextCompat.checkSelfPermission(reactContext, permission) == PackageManager.PERMISSION_GRANTED

    // BLUETOOTH_CONNECT/BLUETOOTH_ADVERTISE are Android 12+ (API 31+)
    // concepts — on older OS versions they don't exist at all, so a runtime
    // permission check for them can never return "granted" and this check
    // must not require them there. Pre-31, advertising is instead covered by
    // the old BLUETOOTH_ADMIN permission, which is "normal" (auto-granted at
    // install, no runtime prompt needed) and already declared in the manifest.
    private fun hasAdvertisePermissions(): Boolean {
        if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.S) return true
        return hasPermission(android.Manifest.permission.BLUETOOTH_CONNECT) &&
            hasPermission(android.Manifest.permission.BLUETOOTH_ADVERTISE)
    }

    @ReactMethod
    fun startAdvertising(localName: String) {
        pendingLocalName = localName
        wantsAdvertising = true

        if (!hasAdvertisePermissions()) {
            val body = Arguments.createMap()
            body.putBoolean("advertising", false)
            body.putString("error", "Missing BLUETOOTH_CONNECT/BLUETOOTH_ADVERTISE permission")
            emit("onAdvertisingStateChange", body)
            return
        }

        val adapter = bluetoothManager?.adapter
        if (adapter == null || !adapter.isEnabled) {
            val body = Arguments.createMap()
            body.putBoolean("advertising", false)
            body.putString("error", "Bluetooth adapter not available or disabled")
            emit("onAdvertisingStateChange", body)
            return
        }

        val stateBody = Arguments.createMap()
        stateBody.putString("state", "poweredOn")
        emit("onStateChange", stateBody)

        beginAdvertisingIfReady(adapter)
    }

    @ReactMethod
    fun stopAdvertising() {
        wantsAdvertising = false
        if (hasAdvertisePermissions()) {
            advertiser?.stopAdvertising(advertiseCallback)
        }
        val body = Arguments.createMap()
        body.putBoolean("advertising", false)
        emit("onAdvertisingStateChange", body)
    }

    @ReactMethod
    fun sendMessage(centralId: String, text: String) {
        if (txCharacteristic == null) return
        val device = subscribedCentrals[centralId] ?: return
        if (!hasAdvertisePermissions()) return

        val payload = text.toByteArray(Charsets.UTF_8) + MESSAGE_DELIMITER
        var offset = 0
        while (offset < payload.size) {
            val end = minOf(offset + WRITE_CHUNK_BYTES, payload.size)
            pendingChunks.add(PendingChunk(device, payload.copyOfRange(offset, end)))
            offset = end
        }
        flushPendingChunks()
    }

    private fun flushPendingChunks() {
        if (flushing) return
        flushing = true
        try {
            val server = gattServer ?: return
            val characteristic = txCharacteristic ?: return
            while (true) {
                val next = pendingChunks.peek() ?: break
                @Suppress("DEPRECATION")
                characteristic.value = next.bytes
                @Suppress("DEPRECATION")
                val queued = server.notifyCharacteristicChanged(next.device, characteristic, false)
                if (!queued) break // wait for onNotificationSent, then retry
                pendingChunks.poll()
            }
        } finally {
            flushing = false
        }
    }

    private fun beginAdvertisingIfReady(adapter: BluetoothAdapter) {
        if (!wantsAdvertising) return

        val rxChar = BluetoothGattCharacteristic(
            RX_CHAR_UUID,
            BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
            BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
        val txChar = BluetoothGattCharacteristic(
            TX_CHAR_UUID,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
        // Android peripherals must expose the CCCD themselves — see class doc comment.
        val cccd = BluetoothGattDescriptor(
            CCCD_UUID,
            BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
        )
        txChar.addDescriptor(cccd)
        txCharacteristic = txChar

        val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        service.addCharacteristic(rxChar)
        service.addCharacteristic(txChar)

        if (!hasAdvertisePermissions()) return
        gattServer?.close()
        gattServer = bluetoothManager?.openGattServer(reactContext, gattServerCallback)
        gattServer?.addService(service)

        advertiser = adapter.bluetoothLeAdvertiser
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(true)
            .addServiceUuid(ParcelUuid(SERVICE_UUID))
            .build()

        adapter.name = pendingLocalName
        advertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            val body = Arguments.createMap()
            body.putBoolean("advertising", true)
            emit("onAdvertisingStateChange", body)
        }

        override fun onStartFailure(errorCode: Int) {
            val body = Arguments.createMap()
            body.putBoolean("advertising", false)
            body.putString("error", "Advertise failed (code $errorCode)")
            emit("onAdvertisingStateChange", body)
        }
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                val id = device.address
                subscribedCentrals.remove(id)
                recvBuffers.remove(id)
                pendingChunks.removeIf { it.device.address == id }
                val body = Arguments.createMap()
                body.putString("centralId", id)
                emit("onCentralUnsubscribed", body)
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
            if (characteristic.uuid == RX_CHAR_UUID) {
                val id = device.address
                val buffer = recvBuffers.getOrPut(id) { mutableListOf() }
                buffer.addAll(value.toList())

                // Split the accumulated buffer on the message delimiter, emitting
                // one event per complete message and leaving any partial tail buffered.
                var start = 0
                for (i in buffer.indices) {
                    if (buffer[i] == MESSAGE_DELIMITER) {
                        val messageBytes = buffer.subList(start, i).toByteArray()
                        val text = String(messageBytes, Charsets.UTF_8)
                        val body = Arguments.createMap()
                        body.putString("centralId", id)
                        body.putString("text", text)
                        emit("onMessageReceived", body)
                        start = i + 1
                    }
                }
                if (start > 0) {
                    val remaining = buffer.subList(start, buffer.size).toList()
                    buffer.clear()
                    buffer.addAll(remaining)
                }
            }
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, android.bluetooth.BluetoothGatt.GATT_SUCCESS, offset, null)
            }
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray,
        ) {
            if (descriptor.uuid == CCCD_UUID) {
                val id = device.address
                val subscribing = value.contentEquals(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                if (subscribing) {
                    subscribedCentrals[id] = device
                    recvBuffers[id] = mutableListOf()
                    val body = Arguments.createMap()
                    body.putString("centralId", id)
                    emit("onCentralSubscribed", body)
                } else {
                    subscribedCentrals.remove(id)
                    recvBuffers.remove(id)
                    val body = Arguments.createMap()
                    body.putString("centralId", id)
                    emit("onCentralUnsubscribed", body)
                }
            }
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
            }
        }

        override fun onNotificationSent(device: BluetoothDevice?, status: Int) {
            flushPendingChunks()
        }
    }

    // React Native's NativeEventEmitter requires these even though we never
    // rely on the JS-side listener count (events are only emitted in
    // response to real Bluetooth activity, never proactively).
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
