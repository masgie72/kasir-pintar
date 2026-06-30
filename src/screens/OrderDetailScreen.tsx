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
  StatusBar,
} from 'react-native';
import { database } from '../database';
import { SafeAreaView } from 'react-native-safe-area-context';
import Order from '../database/models/Order';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { printText } from '../utils/printer';
import { getStoreData } from '../services/storeService';
import { cetakStrukKasir } from '../services/printReceipt';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { theme, themeMode } = useTheme();
  const { orderId, total: initialTotal } = route.params ?? {
    orderId: null,
    total: 0,
  };

  const [total, setTotal] = useState<number>(initialTotal ?? 0);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [kasirName, setKasirName] = useState<string>('Memuat...');

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const order = await database.get<Order>('orders').find(orderId);
        const fetchedItems = (await order.orderItems.fetch()) as any;

        const mappedItems = fetchedItems.map((item: any) => ({
          id: item.id,
          name: item.name || item._raw.name || 'Produk',
          quantity: item.quantity || item._raw.quantity || 0,
          price: Number(item.price || item._raw.price || 0),
        }));

        setItems(mappedItems);
        setTotal(order.totalPrice);

        const uId = order.userId || (order as any)._raw?.user_id;
        if (uId) {
          try {
            const userRecord = (await database.get('users').find(uId)) as any;
            setKasirName(userRecord.name);
          } catch {
            setKasirName(
              'Kasir (ID: ' + uId.substring(0, 4).toUpperCase() + ')',
            );
          }
        } else {
          setKasirName('Tidak Diketahui');
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

    const handlePrint = async () => {
    if (items.length === 0) return;

    setIsPrinting(true);
    try {
      const printerAddress = await AsyncStorage.getItem('printerAddress');

      if (!printerAddress) {
        Alert.alert(
          'Printer Belum Disetting',
          'Silakan pilih dan simpan perangkat printer thermal Anda terlebih dahulu agar bisa mencetak struk.',
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Buka Pengaturan',
              onPress: () => navigation.navigate('PrinterSetting'),
            },
          ],
        );
        setIsPrinting(false);
        return;
      }

      // 1. Ambil detail data order tambahan dari WatermelonDB jika ada
      let orderData: any = null;
      try {
        orderData = await database.get<Order>('orders').find(orderId);
      } catch (e) {
        console.log('Gagal mengambil detail order tambahan:', e);
      }

      // 2. Format Waktu Transaksi secara Lokal (DD-MM-YYYY HH:mm)
      const tglObj = orderData?.createdAt ? new Date(orderData.createdAt) : new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      const waktuFormatted = `${pad(tglObj.getDate())}-${pad(tglObj.getMonth() + 1)}-${tglObj.getFullYear()} ${pad(tglObj.getHours())}:${pad(tglObj.getMinutes())}`;

      // 3. Kalkulasi Data Finansial Struk (Gunakan fallback lokal jika kolom DB kosong)
      const subtotalLokal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      const subtotalVal = orderData?.subtotal || subtotalLokal;
      
      // Ambil nilai diskon dan pajak (Asumsi nominal, silakan sesuaikan dengan model database Anda)
      const diskonVal = orderData?.discount || 0; 
      
      const store = await getStoreData();
      const ppnPercent = store.ppnPercentage || 11;
      
      const discAfterDiscount = subtotalVal - diskonVal;
      const pajakVal = Math.round(discAfterDiscount * (ppnPercent / 100));       
      
      // Uang tunai yang dibayarkan dan kembaliannya
      const tunaiVal = orderData?.amountPaid || total; 
      const kembaliVal = tunaiVal - total > 0 ? tunaiVal - total : 0;

      // 4. Panggil Service Cetak Baru dengan membawa data terformat
      // Pastikan fungsi 'cetakStrukKasir' sudah Anda impor di bagian atas file ini
      await cetakStrukKasir({
        nota: `#${orderId?.slice(-6).toUpperCase() || 'TRX-UNKNOWN'}`,
        kasir: kasirName,
        waktu: waktuFormatted,
        item: items,
        subtotal: subtotalVal,
        diskonNominal: diskonVal,
        diskonPersen: orderData?.discountPercentage || undefined, // Masukkan persentase diskon jika ada
        pajakNominal: pajakVal,
        pajakPersen: ppnPercent > 0 ? ppnPercent : undefined,
        total: total,
        bayar: tunaiVal,
        kembali: kembaliVal
      });

    } catch (error) {
      console.error('Cetak Error:', error);
      Alert.alert('Error ❌', 'Terjadi gangguan koneksi bluetooth printer.');
    } finally {
      setIsPrinting(false);
    }
  };


  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* HEADER UTAMA */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Detail Transaksi 📄
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          ID Pesanan: #{orderId?.slice(-6).toUpperCase() || 'N/A'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Memuat lembar nota...
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* DIGITAL RECEIPT CARD */}
          <View
            style={[
              styles.receiptCard,
              { backgroundColor: theme.card, shadowColor: theme.text },
            ]}
          >
            <View
              style={[
                styles.cashierInfoRow,
                { backgroundColor: theme.borderLight },
              ]}
            >
              <Text
                style={[styles.cashierLabel, { color: theme.textSecondary }]}
              >
                Kasir / Melayani :
              </Text>
              <Text style={[styles.cashierValue, { color: theme.text }]}>
                {kasirName} 💼
              </Text>
            </View>

            {/* TABLE HEADER */}
            <View style={styles.tableHeaderRow}>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { flex: 2, color: theme.textSecondary },
                ]}
              >
                Item
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  {
                    textAlign: 'center',
                    flex: 0.5,
                    color: theme.textSecondary,
                  },
                ]}
              >
                Qty
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { textAlign: 'right', flex: 1.5, color: theme.textSecondary },
                ]}
              >
                Harga
              </Text>
            </View>

            <Text
              style={[styles.dashedLine, { color: theme.border }]}
              numberOfLines={1}
            >
              - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              - - - - - - - - - - - - - -
            </Text>

            {/* LIST ITEMS */}
            <FlatList
              data={items}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfoCol}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={[styles.itemQtyCol, { color: theme.textSecondary }]}
                  >
                    x{item.quantity}
                  </Text>
                  <Text style={[styles.itemPriceCol, { color: theme.text }]}>
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </Text>
                </View>
              )}
            />

            <Text
              style={[styles.dashedLine, { color: theme.border }]}
              numberOfLines={1}
            >
              - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              - - - - - - - - - - - - - - -
            </Text>

            {/* TOTAL TRANSACTION */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Total Belanja
              </Text>
              <Text style={[styles.totalValue, { color: theme.primary }]}>
                Rp {total.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* FOOTER FIX BUTTON */}
      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.btnPrimary,
            { backgroundColor: theme.primary, shadowColor: theme.primary },
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
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  content: { flex: 1, padding: 20 },
  receiptCard: {
    borderRadius: 20,
    padding: 20,
    flex: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cashierInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
  },
  cashierLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  cashierValue: { fontSize: 13, fontWeight: '800' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 4 },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashedLine: { marginVertical: 12, opacity: 0.8, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemInfoCol: { flex: 2 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemQtyCol: {
    flex: 0.5,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  itemPriceCol: {
    flex: 1.5,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 24, fontWeight: '800' },
  footer: { padding: 20, borderTopWidth: 1 },
  btnPrimary: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: { elevation: 0, shadowOpacity: 0 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
