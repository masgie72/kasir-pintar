import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import LogoutIcon from '../assets/icons/logout.svg';

type Props = {
  navigation: any;
  onLogoutSuccess?: () => void;
};

export default function DashboardScreen({
  navigation,
  onLogoutSuccess,
}: Props) {
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
      {/* HEADER - sama seperti HomeScreen */}
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
            <Text style={styles.headerTitle}>Kasir Pintar 💼</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
          <LogoutIcon width={22} height={22} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* MENU CEPAT - copy dari HomeScreen */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#DBEAFE' }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <Text style={[styles.menuText, { color: '#1D4ED8' }]}>
              Mulai Kasir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#E0F2FE' }]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={[styles.menuText, { color: '#0369A1' }]}>Riwayat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#EEF2FF' }]}
            onPress={() => navigation.navigate('Product')}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={[styles.menuText, { color: '#4338CA' }]}>Produk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#ECFDF5' }]}
            onPress={() => navigation.navigate('Report')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={[styles.menuText, { color: '#047857' }]}>Laporan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#FEF3C7' }]}
            onPress={() => navigation.navigate('PrinterSetting')}
          >
            <Text style={styles.menuIcon}>🖨</Text>
            <Text style={[styles.menuText, { color: '#92400E' }]}>Printer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: '#F3E8FF' }]}
            onPress={() => navigation.navigate('Setting')}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={[styles.menuText, { color: '#6B21A8' }]}>
              Pengaturan
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
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  scrollContainer: { padding: 16 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuCard: {
    width: '48%',
    aspectRatio: 1,
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
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  logoutIcon: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
