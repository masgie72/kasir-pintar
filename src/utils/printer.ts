import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

export type PrinterDevice = {
  name: string;
  address: string;
  isConnected?: boolean;
};

const CONNECT_TIMEOUT = 8000;
const WRITE_TIMEOUT = 5000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const getBondedDevices = async (): Promise<PrinterDevice[]> => {
  try {
    const bonded = await RNBluetoothClassic.getBondedDevices();
    return bonded.map((d: any) => ({
      name: d.name || 'Perangkat',
      address: d.address,
    }));
  } catch (e) {
    console.error('Get bonded devices error:', e);
    return [];
  }
};

export const disconnectAll = async () => {
  try {
    await RNBluetoothClassic.disconnectFromDevice('' as any);
  } catch {
    // ignore
  }
};

export const connectPrinter = async (address: string): Promise<boolean> => {
  try {
    await disconnectAll();
    await sleep(300);
    const connected = await RNBluetoothClassic.connectToDevice(address);
    if (!connected) return false;
    await sleep(400);
    return true;
  } catch (e) {
    console.error('Connect error:', e);
    return false;
  }
};

export const printText = async (address: string, text: string): Promise<boolean> => {
  try {
    const ok = await connectPrinter(address);
    if (!ok) return false;
    await RNBluetoothClassic.writeToDevice(address, text);
    await sleep(200);
    await RNBluetoothClassic.disconnectFromDevice(address);
    return true;
  } catch (e) {
    console.error('Print error:', e);
    try {
      await RNBluetoothClassic.disconnectFromDevice(address);
    } catch {}
    return false;
  }
};

export const testPrinterConnection = async (address: string): Promise<boolean> => {
  try {
    const ok = await connectPrinter(address);
    if (!ok) return false;
    const ESC = '\u001b';
    const init = `${ESC}@`;
    const center = `${ESC}a\u0001`;
    const left = `${ESC}a\u0000`;
    const test = `${init}${center}Test Koneksi Berhasil\n${left}Alamat: ${address}\n\n\n`;
    await RNBluetoothClassic.writeToDevice(address, test);
    await sleep(200);
    await RNBluetoothClassic.disconnectFromDevice(address);
    return true;
  } catch (e) {
    console.error('Test print error:', e);
    try {
      await RNBluetoothClassic.disconnectFromDevice(address);
    } catch {}
    return false;
  }
};

export const ensureBluetoothEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await RNBluetoothClassic.isBluetoothEnabled();
    if (!enabled) {
      Alert.alert('Bluetooth Mati', 'Nyalakan Bluetooth untuk menghubungkan printer.');
    }
    return enabled;
  } catch {
    return false;
  }
};

export const getPrinterAddress = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('printerAddress');
};
