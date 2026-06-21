import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {generateReceiptText} from './printerHelper'

export const printReceipt = async (items: any[], total: number) => {
  try {
    const address = await AsyncStorage.getItem('printerAddress');
    if (!address) {
      Alert.alert("Error", "Printer belum diatur di menu Pengaturan!");
      return;
    }

    // 1. Hubungkan ke printer
    const device = await RNBluetoothClassic.connectToDevice(address);
    
    // 2. Generate Teks Struk
    const receiptText = generateReceiptText(items, total);
    
    // 3. Kirim ke printer
    await device.write(receiptText);
    
    // 4. Putus koneksi agar tidak menggantung
    await device.disconnect();
    
  } catch (error) {
    Alert.alert("Gagal Cetak", "Pastikan printer menyala dan terhubung.");
    console.error(error);
  }
};