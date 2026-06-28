import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getStoreData } from '../services/storeService';

// Fungsi untuk merapikan baris belanja
const formatReceiptRow = (name: string, qty: number, price: number) => {
  const priceStr = (qty * price).toLocaleString('id-ID');
  const qtyStr = `${qty}x`;
  const leftSide = `${qtyStr} ${name}`.substring(0, 18);
  const rightSide = priceStr.padStart(13);
  return `${leftSide}${rightSide}`;
};

// Fungsi untuk menyusun isi struk
export const generateReceiptText = async (items: any[], total: number) => {
  const store = await getStoreData();
  let text = `       ${store.name}        \n`;
  text += "================================\n";
  items.forEach(item => {
    text += formatReceiptRow(item.name, item.qty, item.price) + "\n";
  });
  text += "================================\n";
  text += `TOTAL: Rp ${total.toLocaleString('id-ID')}\n`;
  text += "================================\n\n\n";
  return text;
};

// Fungsi utama untuk cetak
export const printReceipt = async (items: any[], total: number) => {
  try {
    const address = await AsyncStorage.getItem('printerAddress');
    if (!address) {
      Alert.alert("Error", "Printer belum diatur!");
      return;
    }

    const device = await RNBluetoothClassic.connectToDevice(address);
    const text = await generateReceiptText(items, total);
    await device.write(text);
    await device.disconnect();
    Alert.alert("Sukses", "Struk berhasil dicetak.");
  } catch (error) {
    Alert.alert("Gagal", "Periksa koneksi printer.");
  }
};