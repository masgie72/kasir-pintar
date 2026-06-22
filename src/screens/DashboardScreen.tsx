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
  const [userName, setUserName] = useState('Kasir');
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
    // 1. Ambil Nama User yang sedang login dari AsyncStorage/Database
    const getUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('user_name'); // Sesuaikan key Anda
        if (savedName) setUserName(savedName);
      } catch (e) {
        console.error(e);
      }
    };

    // 2. Ambil data penjualan secara real-time dari WatermelonDB untuk grafik
    const subSales = database
      .get('orders') // Sesuaikan dengan nama tabel/collection order Anda
      .query()
      .observe()
      .subscribe({
        next: (orders: any[]) => {
          // Logika dummy pembagian omzet mingguan berdasarkan data order nyata
          // Anda bisa menyesuaikan filter tanggal berdasarkan field created_at order Anda
          const nominalSenin = orders.length * 150000; // Contoh kalkulasi dinamis

          setSalesData([
            { day: 'Sen', total: nominalSenin > 0 ? nominalSenin : 450000 },
            { day: 'Sel', total: 320000 },
            { day: 'Rab', total: 600000 },
            { day: 'Kam', total: 150000 },
            { day: 'Jum', total: 750000 },
            { day: 'Sab', total: 900000 },
            { day: 'Min', total: 400000 },
          ]);
          setLoading(false);
        },
        error: () => setLoading(false),
      });

    getUserData();
    return () => subSales.unsubscribe();
  }, []);

  // Mencari nilai tertinggi untuk skala persentase tinggi grafik
  const maxSale = Math.max(...salesData.map(d => d.total), 1);

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          onLogoutSuccess?.();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* HEADER WITH USERNAME */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarPlaceholder}
            onPress={() => navigation.navigate('Setting')}
          >
            <Text style={styles.avatarText}>⚙</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}>Selamat Datang,</Text>
            {/* Menampilkan Nama User Secara Dinamis */}
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
        {/* KONTEN GRAFIK PENJUALAN MINGGUAN */}
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
                // Hitung tinggi batang secara proporsional (Maksimal 120px)
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

        {/* MENU CEPAT SEKUNDER */}
        <View style={styles.menuGrid}>
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

  // Style Baru untuk Grafik Kustom
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
