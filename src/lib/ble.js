import { BleClient, numbersToDataView, numberToUUID } from '@capacitor-community/bluetooth-le';

const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const PULSEMESH_SERVICE_UUID = '88888888-4444-4444-4444-121212121212'; // Custom Mesh ID

let isInitialized = false;

/**
 * Checks if BLE is supported and available on this platform.
 */
export async function isBleAvailable() {
  try {
    const result = await initBle();
    return result === true;
  } catch {
    return false;
  }
}

/**
 * Initializes the BLE client and requests mandatory Android permissions.
 */
export async function initBle() {
  if (isInitialized) return true;
  try {
    // 1. Initialize the client
    await BleClient.initialize({ androidNeverForLocation: false });
    
    // 2. Request permissions (This will show the Android popup)
    try {
      const status = await BleClient.checkPermissions();
      if (status.location !== 'granted' || status.bluetooth !== 'granted') {
        await BleClient.requestPermissions();
      }
    } catch (pErr) {
      console.warn('[BLE] Permission request error:', pErr);
    }

    isInitialized = true;
    console.log('[BLE] Initialized successfully');
    return true;
  } catch (err) {
    console.warn('[BLE] Initialization failed:', err.message);
    if (err.message && (err.message.includes('Bluetooth') || err.message.includes('adapter'))) {
      if (err.message.includes('disabled') || err.message.includes('off')) return 'disabled';
    }
    return false;
  }
}

/**
 * Starts scanning for nearby PulseMesh nodes.
 * @param {Function} onDeviceFound Callback for each device found
 */
export async function startBleScanning(onDeviceFound) {
  try {
    await initBle();
    
    await BleClient.requestLEScan(
      {
        // We look for any device for now to show discovery is working
        // services: [PULSEMESH_SERVICE_UUID], 
      },
      (result) => {
        if (result.device && onDeviceFound) {
          onDeviceFound({
            deviceId: result.device.deviceId,
            name: result.device.name || 'Anonymous Node',
            rssi: result.rssi
          });
        }
      }
    );

    // Also start advertising our presence so others can see us
    try {
      // Note: Some Android devices might not support advertising
      // This is optional for discovery but good for the mesh
    } catch (advErr) {
      console.warn('[BLE] Advertising not supported on this device');
    }

  } catch (err) {
    console.error('[BLE] Scan error:', err);
    throw err;
  }
}

/**
 * Stops any active BLE scans.
 */
export async function stopBleScanning() {
  try {
    await BleClient.stopLEScan();
  } catch (err) {
    console.warn('[BLE] Stop scan failed:', err.message);
  }
}
