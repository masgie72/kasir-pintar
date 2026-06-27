import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database';
import LogoutIcon from '../assets/icons/logout.svg';

type Props = {
  navigation: any;
  onLogoutSuccess?: () => void;
};

export default function DashboardScreen({
  navigation,
  onLogoutSuccess,
}: Props) {
  // 1. Tambahkan state dinamis untuk nama dan role user
  const [userName, setUserName] = useState('Kasir');
  const [userRole, setUserRole] = useState('kasir');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk data grafik penjualan (7 hari terakhir)
  const [salesData, setSalesData] = useState<{ day: string; total: number }[]>([
    { day: 'Sen', total: 0 },
    { day: 'Sel', total: 0 },
    { day: 'Rab', total: 0 },
    { day: 'Kam', total: 0 },
    { day: 'Jum', total: 0 },
    { day: 'Sab', total: 0 },
    { day: 'Min', total: 0 },
  ]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    // Ambil data nama dan role dari AsyncStorage secara dinamis
    const getUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('user_name');
        const savedRole = (await AsyncStorage.getItem('user_role')) || 'kasir';

        if (savedName) setUserName(savedName);
        setUserRole(savedRole);
      } catch (e) {
        console.error('Gagal mengambil data user:', e);
      }
    };

    getUserData();

    let ordersSub: any;
    let itemsSub: any;

    const setupSubscriptions = async () => {
      ordersSub = database
        .get('orders')
        .query()
        .observe()
        .subscribe({
          next: (data: any[]) => setOrders(data),
          error: () => setLoading(false),
        });

      itemsSub = database
        .get('order_items')
        .query()
        .observe()
        .subscribe({
          next: (data: any[]) => setOrderItems(data),
          error: () => setLoading(false),
        });
    };

    setupSubscriptions();

    return () => {
      if (ordersSub) ordersSub.unsubscribe();
      if (itemsSub) itemsSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (orders.length > 0 || orderItems.length > 0 || !loading) {
      setLoading(false);
    }
  }, [orders, orderItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const savedName = await AsyncStorage.getItem('user_name');
      const savedRole = (await AsyncStorage.getItem('user_role')) || 'kasir';
      if (savedName) setUserName(savedName);
      setUserRole(savedRole);
    } catch (e) {
      console.error('Gagal refresh dashboard:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const formatRupiah = (value: number) => {
    if (value >= 1000000) {
      return 'Rp ' + (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'Jt';
    }
    if (value >= 1000) {
      return 'Rp ' + (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return 'Rp ' + value;
  };

  const dailySales = useMemo(() => {
    const omzetPerHari = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    orders.forEach((order) => {
      const tanggalOrder = new Date(Number(order.createdAt || order.created_at));
      const hariKe = tanggalOrder.getDay();
      const harga = Number(order.totalPrice || order.total_price || 0);
      omzetPerHari[hariKe as keyof typeof omzetPerHari] += harga;
    });
    return [
      { day: 'Sen', total: omzetPerHari[1] },
      { day: 'Sel', total: omzetPerHari[2] },
      { day: 'Rab', total: omzetPerHari[3] },
      { day: 'Kam', total: omzetPerHari[4] },
      { day: 'Jum', total: omzetPerHari[5] },
      { day: 'Sab', total: omzetPerHari[6] },
      { day: 'Min', total: omzetPerHari[0] },
    ];
  }, [orders]);

  useEffect(() => {
    setSalesData(dailySales);
  }, [dailySales]);

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0), [orders]);
  const totalOrders = orders.length;
  const totalCost = useMemo(() => orderItems.reduce((sum, i) => sum + (Number(i.costPrice || 0) * Number(i.quantity || 0)), 0), [orderItems]);
  const totalItemsSold = useMemo(() => orderItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0), [orderItems]);
  const profit = totalRevenue - totalCost;

  const maxSale = Math.max(...salesData.map((d) => d.total), 1);

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('user_role');
            await AsyncStorage.removeItem('user_name');
            await AsyncStorage.removeItem('user_id');
            if (onLogoutSuccess) {
              onLogoutSuccess();
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          } catch (e) {
            console.error('Gagal memproses logout dashboard:', e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER WITH DYNAMIC USERNAME */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View>
            <Text style={styles.headerSubtitle}>Selamat Datang,</Text>
            {/* 3. Menampilkan Nama User asli dari database hasil login */}
            <Text style={styles.headerTitle}>{userName} 💼</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <LogoutIcon width={22} height={22} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3B82F6" />
        }
      >
        {/* GRAFIK OMZET */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Grafik Omzet Mingguan</Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#3B82F6"
              style={{ marginVertical: 40 }}
            />
          ) : (
            <View style={styles.chartWrapper}>
              {salesData.map((item, index) => {
                const barHeight = (item.total / maxSale) * 120;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.valueLabel}>
                      <Text style={[styles.valueText, item.total === 0 && styles.valueTextZero]}>
                        {formatRupiah(item.total)}
                      </Text>
                    </View>
                    <View style={styles.barBackground}>
                      <View style={[styles.barActive, { height: barHeight }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.summaryLabel}>Total Omzet</Text>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{formatRupiah(totalRevenue)}</Text>
            <Text style={styles.summaryMeta}>{totalOrders} transaksi</Text>
          </View>
          <View style={[styles.summaryCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.summaryLabel}>Laba Bersih</Text>
            <Text style={[styles.summaryValue, { color: profit >= 0 ? '#16A34A' : '#DC2626' }]}>{formatRupiah(profit)}</Text>
            <Text style={styles.summaryMeta}>{totalItemsSold} item terjual</Text>
          </View>
        </View>

        {/* MENU CEPAT SEKUNDER BERDASARKAN HAK AKSES */}
        <View style={styles.menuGrid}>
          {(userRole === 'owner' || userRole === 'admin') && (
            <TouchableOpacity
              style={[
                styles.menuCard,
                { backgroundColor: '#EFF6FF', width: '100%' },
              ]}
              onPress={() => navigation.navigate(
                userRole === 'owner' ? 'Register' : 'RegisterKasir'
              )}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={[styles.menuText, { color: '#2563EB' }]}>
                {userRole === 'owner' ? 'Tambah Karyawan' : 'Tambah Kasir'}
              </Text>
            </TouchableOpacity>
          )}

          {userRole === 'owner' && (
            <TouchableOpacity
              style={[
                styles.menuCard,
                { backgroundColor: '#ECFDF5', width: '100%' },
              ]}
              onPress={() => navigation.navigate('Report')}
            >
              <Text style={styles.menuIcon}>📊</Text>
              <Text style={[styles.menuText, { color: '#047857' }]}>
                Laporan Omzet
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#FEF3C7' }]}
            onPress={() => navigation.navigate('PrinterSetting')}
          >
            <Text style={styles.menuIcon}>🖨</Text>
            <Text style={[styles.menuText, { color: '#92400E' }]}>
              Printer Bluetooth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#F3E8FF' }]}
            onPress={() => navigation.navigate('Setting')}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={[styles.menuText, { color: '#6B21A8' }]}>
              Pengaturan Kasir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#E0F2FE' }]}
            onPress={() => navigation.navigate('Customer')}
          >
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={[styles.menuText, { color: '#0369A1' }]}>
              Data Pelanggan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#FFF7ED' }]}
            onPress={() => navigation.navigate('Category')}
          >
            <Text style={styles.menuIcon}>🗂️</Text>
            <Text style={[styles.menuText, { color: '#C2410C' }]}>
              Kategori Produk
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarText: { fontSize: 16 },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  logoutIcon: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: { padding: 16 },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 10,
  },
  barContainer: { alignItems: 'center' },
  barBackground: {
    width: 14,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barActive: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  barLabel: { fontSize: 11, color: '#64748B', marginTop: 8, fontWeight: '600' },
  valueLabel: { marginBottom: 4, minHeight: 18, justifyContent: 'center', alignItems: 'center' },
  valueText: { fontSize: 10, color: '#2563EB', fontWeight: '700' },
  valueTextZero: { color: '#94A3B8' },
  summaryRow: { flexDirection: 'row', marginBottom: 16 },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  summaryMeta: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuCard: {
    width: '48%',
    aspectRatio: 1.3,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: { fontSize: 32, marginBottom: 6 },
  menuText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
