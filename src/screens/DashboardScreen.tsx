import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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

  useEffect(() => {
    // 2. Ambil data nama dan role dari AsyncStorage secara dinamis
    const getUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('user_name');
        const savedRole = (await AsyncStorage.getItem('user_role')) || 'kasir';

        if (savedName) setUserName(savedName); // Mengeset nama asli user
        setUserRole(savedRole);
      } catch (e) {
        console.error('Gagal mengambil data user:', e);
      }
    };

    // 2. KALKULASI DINAMIS: Menghitung Omzet Asli 7 Hari Terakhir dari WatermelonDB
    const subSales = database
      .get('orders')
      .query()
      .observe()
      .subscribe({
        next: (orders: any[]) => {
          // Buat wadah penghitung omzet per hari (0 = Minggu, 1 = Senin, dst)
          const omzetPerHari = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

          orders.forEach(order => {
            // 1. Konversi timestamp number dari skema database ke objek tanggal
            const tanggalOrder = new Date(
              Number(order.createdAt || order.created_at),
            );
            const hariKe = tanggalOrder.getDay();
            const harga = Number(order.totalPrice || order.total_price || 0);

            // PERBAIKAN: Tambahkan 'as 0 | 1 | 2 | 3 | 4 | 5 | 6' agar TypeScript tidak komplain
            const indeksHari = hariKe as 0 | 1 | 2 | 3 | 4 | 5 | 6;

            // Akumulasikan total harga pesanan ke hari yang sesuai
            omzetPerHari[indeksHari] += harga;
          });

          setSalesData([
            { day: 'Sen', total: omzetPerHari[1] },
            { day: 'Sel', total: omzetPerHari[2] },
            { day: 'Rab', total: omzetPerHari[3] },
            { day: 'Kam', total: omzetPerHari[4] },
            { day: 'Jum', total: omzetPerHari[5] },
            { day: 'Sab', total: omzetPerHari[6] },
            { day: 'Min', total: omzetPerHari[0] },
          ]);
          setLoading(false);
        },
        error: () => setLoading(false),
      });

    getUserData();
    return () => subSales.unsubscribe();
  }, []);

  const maxSale = Math.max(...salesData.map(d => d.total), 1);

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Bersihkan session data lokal
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('user_role');
            await AsyncStorage.removeItem('user_name');

            // 2. Langsung pemicu fungsi logout bawaan dari props
            if (onLogoutSuccess) {
              onLogoutSuccess();
            } else {
              // Cadangan darurat jika props terlepas, paksa balik ke login via state navigasi dasar
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

        {/* MENU CEPAT SEKUNDER BERDASARKAN HAK AKSES */}
        <View style={styles.menuGrid}>
          {(userRole === 'owner' || userRole === 'admin') && (
            <TouchableOpacity
              style={[
                styles.menuCard,
                { backgroundColor: '#EFF6FF', width: '100%' },
              ]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={[styles.menuText, { color: '#2563EB' }]}>
                Tambah Karyawan Baru
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
