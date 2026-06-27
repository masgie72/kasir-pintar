import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore, CartItem } from '../store/cartStore';
import { createOrder } from '../services/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database';
import { useTheme } from '../theme/ThemeContext';
import Customer from '../database/models/Customer';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'ewallet';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: 'Tunai', icon: '💵' },
  { key: 'transfer', label: 'Transfer', icon: '🏦' },
  { key: 'qris', label: 'QRIS', icon: '📱' },
  { key: 'ewallet', label: 'E-Wallet', icon: '💳' },
];

export default function CheckoutScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { items, clearCart } = useCartStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.min(Number(discount) || 0, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const tax = Math.round(taxableAmount * 0.11);
  const total = taxableAmount + tax;

  useEffect(() => {
    const sub = database.get<Customer>('customers').query().observe().subscribe({
      next: data => setCustomers(data),
    });
    return () => sub.unsubscribe();
  }, []);

  const processCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Info', 'Keranjang belanja kosong.');
      return;
    }
    setIsProcessing(true);
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const userId = route.params?.userId || 'local_user';
      const orderId = await createOrder(userId, total, items, deviceId ?? '', paymentMethod, selectedCustomerId || undefined);
      clearCart();
      Alert.alert('Sukses', 'Transaksi berhasil diproses!', [
        { text: 'Lihat Detail', onPress: () => navigation.replace('OrderDetail', { orderId }) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Gagal memproses transaksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: isTablet ? 24 : 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ringkasan Belanja</Text>
        <View style={[styles.cartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {items.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>Keranjang kosong.</Text>
          ) : (
            items.map((item) => (
              <View key={item.productId} style={[styles.cartRow, { borderBottomColor: theme.borderLight }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cartName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.cartMeta, { color: theme.textSecondary }]}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
                </View>
                <Text style={[styles.cartPrice, { color: theme.text }]}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Pelanggan</Text>
        <TouchableOpacity style={[styles.selectBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowCustomerModal(true)}>
          <Text style={[styles.selectLabel, { color: theme.text }]}>
            {selectedCustomerId
              ? customers.find(c => c.id === selectedCustomerId)?.name || 'Pilih Pelanggan'
              : 'Pilih Pelanggan (Opsional)'}
          </Text>
          <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Metode Pembayaran</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.paymentCard, paymentMethod === opt.key && styles.paymentCardActive, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setPaymentMethod(opt.key)}
            >
              <Text style={styles.paymentIcon}>{opt.icon}</Text>
              <Text style={[styles.paymentLabel, paymentMethod === opt.key && styles.paymentLabelActive, { color: theme.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Diskon & Catatan</Text>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Diskon (Rp)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />
          </View>
        </View>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Catatan Pesanan</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          placeholder="Contoh: Tanpa gula, extra es..."
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rincian Harga</Text>
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text><Text style={[styles.summaryValue, { color: theme.text }]}>Rp {subtotal.toLocaleString('id-ID')}</Text></View>
          <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Diskon</Text><Text style={[styles.summaryValue, { color: theme.danger }]}>- Rp {discountAmount.toLocaleString('id-ID')}</Text></View>
          <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>PPN 11%</Text><Text style={[styles.summaryValue, { color: theme.text }]}>Rp {tax.toLocaleString('id-ID')}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total Bayar</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>Rp {total.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bottomLabel, { color: theme.textSecondary }]}>Total Bayar</Text>
          <Text style={[styles.bottomTotal, { color: theme.text }]}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity style={[styles.payBtn, isProcessing && styles.payBtnDisabled, { backgroundColor: theme.primary }]} onPress={processCheckout} disabled={isProcessing || items.length === 0}>
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Bayar Sekarang</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.customerModal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Pelanggan</Text>
            <FlatList
              data={customers}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.customerRow, { borderBottomColor: theme.borderLight }]} onPress={() => { setSelectedCustomerId(item.id); setShowCustomerModal(false); }}>
                  <View>
                    <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>{item.phone}</Text>
                  </View>
                  {selectedCustomerId === item.id && <Text style={{ color: theme.primary, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>Belum ada pelanggan.</Text>}
            />
            <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: theme.borderLight }]} onPress={() => setShowCustomerModal(false)}>
              <Text style={[styles.closeModalText, { color: theme.textSecondary }]}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  cartCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  cartName: { fontSize: 15, fontWeight: '600', lineHeight: 18 },
  cartMeta: { fontSize: 12, marginTop: 2 },
  cartPrice: { fontSize: 14, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  selectLabel: { fontSize: 15, fontWeight: '500' },
  selectArrow: { fontSize: 22 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentCard: { flex: 1, minWidth: '45%', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  paymentCardActive: { borderColor: '#3B82F6' },
  paymentIcon: { fontSize: 24, marginBottom: 4 },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  paymentLabelActive: { fontWeight: '700' },
  formRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  summaryCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    borderTopWidth: 1,
  },
  bottomLabel: { fontSize: 12, fontWeight: '600' },
  bottomTotal: { fontSize: 20, fontWeight: '800' },
  payBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  customerModal: { borderRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  customerName: { fontSize: 15, fontWeight: '600' },
  customerPhone: { fontSize: 13, marginTop: 2 },
  closeModalBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeModalText: { fontWeight: '700', fontSize: 15 },
});
