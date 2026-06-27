
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import { SafeAreaView } from 'react-native-safe-area-context';
import Order from '../database/models/Order';
import { useTheme } from '../theme/ThemeContext';

export default function ReportScreen() {
  const { theme } = useTheme();
  const [totalOmzet, setTotalOmzet] = useState<number>(0);
  const [transactions, setTransactions] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  useEffect(() => {
    // 💡 Mengamati data secara real-time agar omzet otomatis bertambah saat ada transaksi baru
    const ordersCollection = database.get<Order>('orders');

    // Membuat batas waktu milidetik untuk hari ini (00:00:00 sampai 23:59:59)
    const awalHariIni = new Date();
    awalHariIni.setHours(0, 0, 0, 0);
    const startTimestamp = awalHariIni.getTime();

    const akhirHariIni = new Date();
    akhirHariIni.setHours(23, 5, 59, 999);
    const endTimestamp = akhirHariIni.getTime();

    const subscription = ordersCollection
      .query(
        Q.where('created_at', Q.between(startTimestamp, endTimestamp)),
        Q.sortBy('created_at', Q.desc) // Transaksi terbaru muncul paling atas
      )
      .observe()
      .subscribe({
        next: (orders) => {
          // 💡 DIPERBAIKI: Menggunakan order.totalPrice sesuai dengan properti skema Anda
          const total = orders.reduce((sum: number, order: any) => {
            return sum + Number(order.totalPrice || order._raw.total_price || 0);
          }, 0);
          
          setTotalOmzet(total);
          setTransactions(orders);
          setLoading(false);
        },
        error: (err) => {
          console.error('Gagal memuat laporan:', err);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Laporan Kasir 📊</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Pantau ringkasan performa penjualan Anda</Text>
        </View>

        {/* KARTU RINGKASAN OMZET */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Total Omzet Hari Ini</Text>
          <Text style={[styles.amount, { color: theme.primary }]}>Rp {totalOmzet.toLocaleString('id-ID')}</Text>
          <Text style={[styles.cardFooter, { color: theme.textSecondary }]}>✨ Terupdate otomatis dari mesin kasir</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Riwayat Transaksi Hari Ini ({transactions.length})</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Belum ada transaksi masuk untuk hari ini 📝</Text>
              </View>
            }
            renderItem={({ item }: { item: any }) => {
              const waktuFormat = item.createdAt 
                ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                : '--:--';

              return (
                <View style={[styles.transactionItem, { borderBottomColor: theme.borderLight }]}>
                  <View>
                    <Text style={[styles.orderId, { color: theme.text }]}>ID: #{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.timeText, { color: theme.textSecondary }]}>🕒 Jam {waktuFormat}</Text>
                  </View>
                  <Text style={[styles.price, { color: theme.success }]}>
                    + Rp {Number(item.totalPrice || item._raw.total_price || 0).toLocaleString('id-ID')}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingVertical: 16, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  card: { 
    padding: 24, 
    borderRadius: 18, 
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  amount: { fontSize: 30, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  cardFooter: { fontSize: 11, marginTop: 12, fontStyle: 'italic' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  transactionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 10,
    borderWidth: 1,
  },
  orderId: { fontWeight: '700', fontSize: 14 },
  timeText: { fontSize: 12, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  price: { fontWeight: '800', fontSize: 15 },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: '500' }
});

