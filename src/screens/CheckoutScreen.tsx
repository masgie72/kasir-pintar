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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: isTablet ? 24 : 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        <Text style={styles.sectionTitle}>Ringkasan Belanja</Text>
        <View style={styles.cartCard}>
          {items.length === 0 ? (
            <Text style={styles.empty}>Keranjang kosong.</Text>
          ) : (
            items.map((item) => (
              <View key={item.productId} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartMeta}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</Text>
                </View>
                <Text style={styles.cartPrice}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Pelanggan</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCustomerModal(true)}>
          <Text style={styles.selectLabel}>
            {selectedCustomerId
              ? customers.find(c => c.id === selectedCustomerId)?.name || 'Pilih Pelanggan'
              : 'Pilih Pelanggan (Opsional)'}
          </Text>
          <Text style={styles.selectArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.paymentCard, paymentMethod === opt.key && styles.paymentCardActive]}
              onPress={() => setPaymentMethod(opt.key)}
            >
              <Text style={styles.paymentIcon}>{opt.icon}</Text>
              <Text style={[styles.paymentLabel, paymentMethod === opt.key && styles.paymentLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Diskon & Catatan</Text>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Diskon (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
            />
          </View>
        </View>
        <Text style={styles.fieldLabel}>Catatan Pesanan</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Contoh: Tanpa gula, extra es..."
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Text style={styles.sectionTitle}>Rincian Harga</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>Rp {subtotal.toLocaleString('id-ID')}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Diskon</Text><Text style={[styles.summaryValue, { color: '#DC2626' }]}>- Rp {discountAmount.toLocaleString('id-ID')}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>PPN 11%</Text><Text style={styles.summaryValue}>Rp {tax.toLocaleString('id-ID')}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalValue}>Rp {total.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomLabel}>Total Bayar</Text>
          <Text style={styles.bottomTotal}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity style={[styles.payBtn, isProcessing && styles.payBtnDisabled]} onPress={processCheckout} disabled={isProcessing || items.length === 0}>
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Bayar Sekarang</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showCustomerModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.customerModal}>
            <Text style={styles.modalTitle}>Pilih Pelanggan</Text>
            <FlatList
              data={customers}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.customerRow} onPress={() => { setSelectedCustomerId(item.id); setShowCustomerModal(false); }}>
                  <View>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerPhone}>{item.phone}</Text>
                  </View>
                  {selectedCustomerId === item.id && <Text style={{ color: '#3B82F6', fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Belum ada pelanggan.</Text>}
            />
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCustomerModal(false)}>
              <Text style={styles.closeModalText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  cartCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  cartName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  cartMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cartPrice: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  empty: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  selectLabel: { fontSize: 15, color: '#334155', fontWeight: '500' },
  selectArrow: { fontSize: 22, color: '#94A3B8' },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  paymentCardActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  paymentIcon: { fontSize: 24, marginBottom: 4 },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  paymentLabelActive: { color: '#2563EB', fontWeight: '700' },
  formRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  totalRow: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 10, marginTop: 6 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#2563EB' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderTopWidth: 1, borderColor: '#E2E8F0', padding: 16, gap: 12,
  },
  bottomLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  bottomTotal: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  payBtn: { backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  payBtnDisabled: { backgroundColor: '#94A3B8' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  customerModal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  customerPhone: { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeModalBtn: { marginTop: 12, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeModalText: { color: '#475569', fontWeight: '700', fontSize: 15 },
});
