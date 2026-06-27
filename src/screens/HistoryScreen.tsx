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
import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import { SafeAreaView } from 'react-native-safe-area-context';
import Order from '../database/models/Order';

export default function HistoryScreen({ navigation }: any) {
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
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.trxId}>
              TRX-{item.id.substring(0, 6).toUpperCase()}
            </Text>
            <Text style={styles.trxDate}>{dateString}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Selesai</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.detailText}>Lihat detail pesanan →</Text>
          <Text style={styles.totalPrice}>
            Rp {hargaTotal.toLocaleString('id-ID')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 👑 BARIS SEGMENTED FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {(['hariIni', '7hari', 'semua'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterBtn,
              filterType === type && styles.filterBtnActive,
            ]}
            onPress={() => setFilterType(type)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterType === type && styles.filterBtnTextActive,
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

      {/* FLATLIST DAFTAR STRUK BERDASARKAN HASIL FILTER */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
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
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  // Style Baru untuk Penataan Baris Tombol Filter Waktu
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  trxDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
