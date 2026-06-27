import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import { useTheme } from '../theme/ThemeContext';
import { Q } from '@nozbe/watermelondb';
import Order from '../database/models/Order';

export default function HistoryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'hariIni' | '7hari' | 'semua'>('hariIni');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    const ordersCollection = database.get('orders');

    const query = ordersCollection
      .query(Q.sortBy('created_at', Q.desc))
      .observe();

    const subscription = query.subscribe(data => {
      setOrders(data);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👑 FILTER LOGIK: Menyaring transaksi berdasarkan tanggal nyata dari database
  const filteredOrders = useMemo(() => {
    const sekarang = new Date();
    // Cari batas waktu awal hari ini jam 00:00
    const awalHariIni = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate(),
    ).getTime();
    // Batas waktu 7 hari lalu
    const tujuhHariLalu = awalHariIni - 7 * 24 * 60 * 60 * 1000;

    return orders.filter(order => {
      const timestamp = Number(order.createdAt || order._raw?.created_at || 0);
      if (filterType === 'hariIni') return timestamp >= awalHariIni;
      if (filterType === '7hari') return timestamp >= tujuhHariLalu;
      return true; // Mode 'semua'
    });
  }, [orders, filterType]);

  const renderOrderItem = ({ item }: { item: any }) => {
    const dateString = item.createdAt
      ? new Date(item.createdAt).toLocaleString('id-ID')
      : item._raw?.created_at
      ? new Date(Number(item._raw.created_at)).toLocaleString('id-ID')
      : 'Waktu tidak diketahui';

    const hargaTotal = Number(item.totalPrice || item._raw?.total_price || 0);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.trxId, { color: theme.text }]}>
              TRX-{item.id.substring(0, 6).toUpperCase()}
            </Text>
            <Text style={[styles.trxDate, { color: theme.textSecondary }]}>{dateString}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.successLight }]}>
            <Text style={[styles.badgeText, { color: theme.success }]}>Selesai</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

        <View style={styles.cardFooter}>
          <Text style={[styles.detailText, { color: theme.primary }]}>Lihat detail pesanan →</Text>
          <Text style={[styles.totalPrice, { color: theme.text }]}>
            Rp {hargaTotal.toLocaleString('id-ID')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Riwayat Transaksi</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* FILTER BUTTONS */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['hariIni', '7hari', 'semua'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterBtn,
              filterType === type && { backgroundColor: theme.primary },
              { backgroundColor: theme.borderLight },
            ]}
            onPress={() => setFilterType(type)}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: theme.text },
              ]}
            >
              {type === 'hariIni'
                ? 'Hari Ini'
                : type === '7hari'
                ? '7 Hari'
                : 'Semua'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FLATLIST */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tidak ada riwayat transaksi pada rentang ini.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trxId: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trxDate: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803D',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
