import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { printText, disconnectAll } from '../utils/printer';
import { getStoreData } from './storeService';

export const cetakStrukKasir = async (dataTransaksi: {
  nota: string;
  item: any[];
  total: number;
  bayar: number;
  kembali: number;
}) => {
  try {
    const printerAddress = await AsyncStorage.getItem('printerAddress');
    if (!printerAddress) {
      Alert.alert('Printer Belum Siap', 'Silakan pilih dan simpan printer terlebih dahulu di halaman Pengaturan.');
      return;
    }

    const store = await getStoreData();

    const ESC = '\u001b';
    const initPrinter = `${ESC}@`;
    const alignCenter = `${ESC}a\u0001`;
    const alignLeft = `${ESC}a\u0000`;

    let struk = '';
    struk += initPrinter;
    struk += alignCenter;
    struk += `${store.name}\n`;
    struk += `${store.address}\n`;
    struk += `Telp: ${store.phone}\n`;
    struk += "--------------------------------\n";
    struk += `No. Nota: ${dataTransaksi.nota}\n`;
    struk += "================================\n";

    struk += alignLeft;
    dataTransaksi.item.forEach((produk) => {
      struk += `${produk.name}\n`;
      const detailHarga = `${produk.quantity} x Rp ${produk.price}`;
      const subTotal = `Rp ${produk.quantity * produk.price}`;
      const spasi = ' '.repeat(Math.max(1, 32 - (detailHarga.length + subTotal.length)));
      struk += `${detailHarga}${spasi}${subTotal}\n`;
    });

    struk += "================================\n";

    const txtTotal = `TOTAL: Rp ${dataTransaksi.total.toLocaleString('id-ID')}`;
    struk += ' '.repeat(Math.max(1, 32 - txtTotal.length)) + `${txtTotal}\n`;

    const txtBayar = `BAYAR: Rp ${dataTransaksi.bayar.toLocaleString('id-ID')}`;
    struk += ' '.repeat(Math.max(1, 32 - txtBayar.length)) + `${txtBayar}\n`;

    const txtKembali = `KEMBALI: Rp ${dataTransaksi.kembali.toLocaleString('id-ID')}`;
    struk += ' '.repeat(Math.max(1, 32 - txtKembali.length)) + `${txtKembali}\n`;

    struk += "\n";
    struk += alignCenter;
    struk += "Terima Kasih Atas\nKunjungan Anda\n\n\n\n";

    const success = await printText(printerAddress, struk);
    if (!success) {
      Alert.alert('Gagal', 'Gagal mengirim data ke printer. Pastikan printer menyala dan terhubung.');
    }
  } catch (error) {
    console.error('Cetak Error:', error);
    Alert.alert('Error', 'Terjadi masalah saat mengirim data ke printer.');
    try {
      await disconnectAll();
    } catch {}
  }
};