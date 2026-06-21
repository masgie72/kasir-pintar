
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { database } from '../database';
import { SafeAreaView } from 'react-native-safe-area-context';
import Order from '../database/models/Order';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId, total: initialTotal } = route.params ?? {
    orderId: null,
    total: 0,
  };

  const [total, setTotal] = useState<number>(initialTotal ?? 0);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false); // State untuk memantau proses cetak

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const order = await database.get<Order>('orders').find(orderId);
        const fetchedItems = await order.orderItems.fetch();

        const mappedItems = fetchedItems.map((item: any) => ({
          id: item.id,
          name: item.name || item._raw.name || 'Produk',
          quantity: item.quantity || item._raw.quantity || 0,
          price: Number(item.price || item._raw.price || 0),
        }));

        setItems(mappedItems);
        setTotal(order.totalPrice);
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // 💡 FUNGSI UTAMA BARU UNTUK MENCETAK VIA BLUETOOTH CLASSIC
  const handlePrint = async () => {
    if (items.length === 0) return;

    setIsPrinting(true);
    try {
      // 1. Ambil MAC Address printer dari AsyncStorage yang disimpan di halaman setelan
      const printerAddress = await AsyncStorage.getItem('printerAddress');

    if (!printerAddress) {
  Alert.alert(
    'Printer Belum Disetting', // Judul
    'Silakan pilih dan simpan perangkat printer thermal Anda terlebih dahulu agar bisa mencetak struk.', // Pesan
    [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Buka Pengaturan', 
        onPress: () => navigation.navigate('PrinterSetting') // 👈 Mengarahkan kasir langsung ke screen scan printer
      }
    ]
  );
  setIsPrinting(false);
  return;
}

      // 2. Hubungkan langsung ke perangkat printer thermal
      const connected = await RNBluetoothClassic.connectToDevice(
        printerAddress,
      );

      if (connected) {
        // Karakter kontrol printer ESC/POS
        const ESC = '\u001b';
        const initPrinter = `${ESC}@`;
        const alignCenter = `${ESC}a\u0001`;
        const alignLeft = `${ESC}a\u0000`;

        let struk = '';

        // --- Susun Teks Struk (Batas Maksimal Lebar Kertas 58mm = 32 Karakter) ---
        struk += initPrinter;
        struk += alignCenter;
        struk += 'KASIR PINTAR TOKO\n';
        struk += 'Detail Riwayat Transaksi\n';
        struk += `ID: #${orderId?.slice(-6).toUpperCase()}\n`;
        struk += '--------------------------------\n'; // 32 Karakter pembatas

        struk += alignLeft;
        items.forEach(item => {
          // Baris 1: Nama Item Produk
          struk += `${item.name.slice(0, 32)}\n`;

          // Baris 2: Detail Qty x Harga di Kiri dan Subtotal di Kanan
          const detailHarga = `${
            item.quantity
          } x Rp ${item.price.toLocaleString('id-ID')}`;
          const subTotal = `Rp ${(item.quantity * item.price).toLocaleString(
            'id-ID',
          )}`;
          const sisaSpasi = 32 - (detailHarga.length + subTotal.length);
          const spasiPemisah = ' '.repeat(sisaSpasi > 0 ? sisaSpasi : 1);

          struk += `${detailHarga}${spasiPemisah}${subTotal}\n`;
        });

        struk += '--------------------------------\n';

        // Baris Total Akhir Belanja
        const teksTotalLabel = 'TOTAL AKHIR:';
        const teksTotalHarga = `Rp ${total.toLocaleString('id-ID')}`;
        const spasiTotal = ' '.repeat(
          32 - (teksTotalLabel.length + teksTotalHarga.length),
        );
        struk += `${teksTotalLabel}${spasiTotal}${teksTotalHarga}\n`;

        struk += '\n';
        struk += alignCenter;
        struk += 'Terima Kasih\nAtas Kepercayaan Anda 🙏\n\n\n\n'; // Jarak potong kertas

        // 3. Kirim data teks mentah ke mesin printer
        await RNBluetoothClassic.writeToDevice(printerAddress, struk);

        // 4. Putus koneksi agar baterai printer dan HP hemat
        await RNBluetoothClassic.disconnectFromDevice(printerAddress);
        Alert.alert('Sukses 🎉', 'Nota belanja sedang dicetak.');
      } else {
        Alert.alert(
          'Koneksi Gagal',
          'Gagal menyambungkan ke printer. Pastikan mesin menyala.',
        );
      }
    } catch (error) {
      console.error('Cetak Error:', error);
      Alert.alert('Error ❌', 'Terjadi gangguan koneksi bluetooth printer.');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* HEADER UTAMA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Detail Transaksi 📄</Text>
        <Text style={styles.headerSubtitle}>
          ID Pesanan: #{orderId?.slice(-6).toUpperCase() || 'N/A'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Memuat lembar nota...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* DIGITAL RECEIPT CARD */}
          <View style={styles.receiptCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { textAlign: 'center', flex: 0.5 },
                ]}
              >
                Qty
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { textAlign: 'right', flex: 1.5 },
                ]}
              >
                Harga
              </Text>
            </View>

            <Text style={styles.dashedLine} numberOfLines={1}>
              - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              - - - - - - - - - - - - - - -
            </Text>

            <FlatList
              data={items}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfoCol}>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemQtyCol}>x{item.quantity}</Text>
                  <Text style={styles.itemPriceCol}>
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </Text>
                </View>
              )}
            />

            <Text style={styles.dashedLine} numberOfLines={1}>
              - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              - - - - - - - - - - - - - - -
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Belanja</Text>
              <Text style={styles.totalValue}>
                Rp {total.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* FOOTER FIX BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.btnPrimary,
            (items.length === 0 || isPrinting) && styles.btnDisabled,
          ]}
          onPress={handlePrint}
          disabled={items.length === 0 || loading || isPrinting}
        >
          {isPrinting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnText}>🖨️ Cetak Struk Belanja</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  content: { flex: 1, padding: 20 },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flex: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 4 },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashedLine: {
    color: '#CBD5E1',
    marginVertical: 12,
    opacity: 0.8,
    letterSpacing: 1,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemInfoCol: { flex: 2 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  itemQtyCol: {
    flex: 0.5,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  itemPriceCol: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#2563EB' },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnPrimary: {
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: { backgroundColor: '#94A3B8', elevation: 0, shadowOpacity: 0 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

