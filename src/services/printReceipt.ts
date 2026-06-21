
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const cetakStrukKasir = async (dataTransaksi: {
  nota: string;
  item: any[];
  total: number;
  bayar: number;
  kembali: number;
}) => {
  try {
    // 1. Ambil MAC Address printer yang sudah dipilih user dari AsyncStorage
    const printerAddress = await AsyncStorage.getItem('printerAddress');

    if (!printerAddress) {
      Alert.alert('Printer Belum Siap', 'Silakan pilih dan simpan printer terlebih dahulu di halaman Pengaturan.');
      return;
    }

    // 2. Hubungkan ke printer menggunakan alamat yang disimpan
    const connected = await RNBluetoothClassic.connectToDevice(printerAddress);
    
    if (connected) {
      // Perintah ESC/POS standar untuk inisialisasi printer & teks rata tengah
      const ESC = '\u001b';
      const initPrinter = `${ESC}@`;
      const alignCenter = `${ESC}a\u0001`;
      const alignLeft = `${ESC}a\u0000`;
      
      let struk = '';
      
      // Susun Teks Struk Belanja
      struk += initPrinter;
      struk += alignCenter;
      struk += "KASIR PINTAR TOKO\n";
      struk += "Jl. Pahlawan No. 10, Tegal\n";
      struk += `No. Nota: ${dataTransaksi.nota}\n`;
      struk += "================================\n"; // 32 Karakter standar printer 58mm
      
      struk += alignLeft;
      // Looping daftar barang yang dibeli
      dataTransaksi.item.forEach((produk) => {
        struk += `${produk.name}\n`;
        // Format layout harga kanan-kiri manual agar rapi
        const detailHarga = `${produk.quantity} x Rp ${produk.price}`;
        const subTotal = `Rp ${produk.quantity * produk.price}`;
        const spasi = ' '.repeat(32 - (detailHarga.length + subTotal.length));
        struk += `${detailHarga}${spasi}${subTotal}\n`;
      });
      
      struk += "================================\n";
      
      // Total Akhir
      const txtTotal = `TOTAL: Rp ${dataTransaksi.total}`;
      struk += ' '.repeat(32 - txtTotal.length) + `${txtTotal}\n`;
      
      const txtBayar = `BAYAR: Rp ${dataTransaksi.bayar}`;
      struk += ' '.repeat(32 - txtBayar.length) + `${txtBayar}\n`;
      
      const txtKembali = `KEMBALI: Rp ${dataTransaksi.kembali}`;
      struk += ' '.repeat(32 - txtKembali.length) + `${txtKembali}\n`;
      
      struk += "\n";
      struk += alignCenter;
      struk += "Terima Kasih Atas\nKunjungan Anda 🙏\n\n\n\n"; // Beri jarak kertas kosong untuk merobek struk

      // 3. Kirim data string struk ke printer
      await RNBluetoothClassic.writeToDevice(printerAddress, struk);
      
      // 4. Putuskan koneksi agar printer bisa diakses perangkat lain secara bergantian
      await RNBluetoothClassic.disconnectFromDevice(printerAddress);
    } else {
      Alert.alert('Koneksi Gagal', 'Gagal menyambungkan ke printer Bluetooth.');
    }
  } catch (error) {
    console.error('Cetak Error:', error);
    Alert.alert('Error', 'Terjadi masalah saat mengirim data ke printer.');
  }
};

