import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulsemesh.app',
  appName: 'PulseMesh',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for nearby mesh nodes...',
        cancel: 'Stop',
        availableDevices: 'Nearby Devices',
        noDeviceFound: 'No mesh nodes found',
      },
    },
  },
};

export default config;
