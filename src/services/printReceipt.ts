import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { printText, disconnectAll } from '../utils/printer';
import { getStoreData } from './storeService';

// ==========================================
// FUNGSI PEMBANTU (HELPER) UNTUK LAYOUT 58MM
// ==========================================

/**
 * Memotong atau memecah teks panjang menjadi beberapa baris agar tidak merusak layout
 */
const wrapText = (text: string, maxChars: number = 32): string[] => {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length < maxChars) {
      currentLine += (currentLine === '' ? '' : ' ') + word;
    } else {
      if (currentLine !== '') lines.push(currentLine);
      currentLine = word.substring(0, maxChars); // Cegah kata tunggal melebihi batas
    }
  });
  if (currentLine !== '') lines.push(currentLine);
  return lines.length === 0 ? [''] : lines;
};

/**
 * Membuat format satu baris isi 2 kolom (Kiri & Kanan) rata pinggir
 */
const formatDuaKolom = (left: string, right: string, maxChars: number = 32): string => {
  const sisaSpasi = maxChars - (left.length + right.length);
  const spasi = ' '.repeat(Math.max(1, sisaSpasi));
  return `${left}${spasi}${right}\n`;
};

// ==========================================
// SERVICE UTAMA CETAK STRUK
// ==========================================
export const cetakStrukKasir = async (dataTransaksi: {
  nota: string;
  kasir: string;
  waktu: string; // Format yang disarankan: DD-MM-YYYY HH:mm
  item: any[];
  subtotal: number;
  diskonNominal: number;
  diskonPersen?: number; // Opsional: untuk teks keterangan label, misal: 10
  pajakNominal: number;
  pajakPersen?: number;  // Opsional: untuk teks keterangan label, misal: 11
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
    const LEBAR_STRUK = 32; // Batas karakter horizontal printer 58mm

    // Kode Perintah ESC/POS Native Printer
    const ESC = '\u001b';
    const initPrinter = `${ESC}@`;
    const alignCenter = `${ESC}a\u0001`;
    const alignLeft = `${ESC}a\u0000`;

    let struk = '';
    struk += initPrinter;

    // 1. HEADER TOKO (Rata Tengah)
    struk += alignCenter;
    struk += "================================\n";
    wrapText((store.name || 'TOKO KASIR').toUpperCase(), LEBAR_STRUK).forEach(line => { struk += `${line}\n`; });
    wrapText(store.address || '', LEBAR_STRUK).forEach(line => { struk += `${line}\n`; });
    if (store.phone) {
      struk += `Telp: ${store.phone}\n`;
    }
    struk += "================================\n";

    // 2. METADATA TRANSAKSI (Rata Kiri)
    struk += alignLeft;
    struk += `No. Struk : ${dataTransaksi.nota}\n`;
    struk += `Kasir     : ${dataTransaksi.kasir.slice(0, 20)}\n`;
    struk += `Waktu     : ${dataTransaksi.waktu}\n`;
    struk += "--------------------------------\n";

    // 3. DAFTAR ITEM BELANJA
    dataTransaksi.item.forEach((produk) => {
      // Mengantisipasi jika nama produk sangat panjang, dipotong per baris secara rapi
      const namaProdukWrapped = wrapText(produk.name, LEBAR_STRUK);
      namaProdukWrapped.forEach((line) => {
        struk += `${line}\n`;
      });

      // Baris rincian kalkulasi harga produk sesuai template target
      const detailHarga = `   ${produk.quantity} x Rp ${produk.price.toLocaleString('id-ID')}`;
      const subTotalItem = `Rp  ${(produk.quantity * produk.price).toLocaleString('id-ID')}`;
      
      struk += formatDuaKolom(detailHarga, subTotalItem, LEBAR_STRUK);
    });

    struk += "--------------------------------\n";

    // 4. RINCIAN BIAYA, DISKON & PAJAK
    const txtSubtotalValue = `Rp  ${dataTransaksi.subtotal.toLocaleString('id-ID')}`;
    struk += formatDuaKolom("SUBTOTAL", txtSubtotalValue, LEBAR_STRUK);

    // Tampilkan baris diskon hanya jika nilainya lebih dari 0
    if (dataTransaksi.diskonNominal > 0) {
      const labelDiskon = dataTransaksi.diskonPersen ? `DISKON (${dataTransaksi.diskonPersen}%)` : "DISKON";
      const txtDiskonValue = `-Rp   ${dataTransaksi.diskonNominal.toLocaleString('id-ID')}`;
      struk += formatDuaKolom(labelDiskon, txtDiskonValue, LEBAR_STRUK);
    }

    // Tampilkan baris pajak hanya jika nilainya lebih dari 0
    if (dataTransaksi.pajakNominal > 0) {
      const labelPajak = dataTransaksi.pajakPersen ? `PAJAK (${dataTransaksi.pajakPersen}%)` : "PAJAK";
      const txtPajakValue = `Rp   ${dataTransaksi.pajakNominal.toLocaleString('id-ID')}`;
      struk += formatDuaKolom(labelPajak, txtPajakValue, LEBAR_STRUK);
    }

    struk += "--------------------------------\n";

    // 5. TOTAL, TUNAI & KEMBALIAN
    const txtTotalValue = `Rp  ${dataTransaksi.total.toLocaleString('id-ID')}`;
    struk += formatDuaKolom("TOTAL", txtTotalValue, LEBAR_STRUK);

    const txtBayarValue = `Rp ${dataTransaksi.bayar.toLocaleString('id-ID')}`;
    struk += formatDuaKolom("TUNAI", txtBayarValue, LEBAR_STRUK);

    const txtKembaliValue = `Rp  ${dataTransaksi.kembali.toLocaleString('id-ID')}`;
    struk += formatDuaKolom("KEMBALIAN", txtKembaliValue, LEBAR_STRUK);

    // 6. FOOTER NOTA (Rata Tengah)
    struk += "================================\n";
    struk += alignCenter;
    struk += "Terima Kasih & Selamat Belanja\n";
    struk += "   Barang yang sudah dibeli   \n";
    struk += "tidak dapat ditukar/dikembalikan\n";
    struk += "================================\n\n\n\n"; // 4 baris kosong untuk jarak sobek kertas

    // Eksekusi Pengiriman ke Buffer Printer Bluetooth
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
