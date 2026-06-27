import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  NativeEventEmitter,
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBondedDevices,
  testPrinterConnection,
  printText,
  disconnectAll,
} from '../utils/printer';

export default function PrinterSettingScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const emitterRef = useRef<NativeEventEmitter | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('printerAddress').then(addr => setSavedAddress(addr));

    try {
      const emitter = new NativeEventEmitter(RNBluetoothClassic as any);
      emitterRef.current = emitter;

      const subFound = emitter.addListener('BluetoothDeviceFound', (device: any) => {
        setDevices(prev => {
          if (prev.find(d => d.address === device.address)) return prev;
          return [...prev, device];
        });
      });

      const subDone = emitter.addListener('BluetoothDiscoveryFinished', () => {
        setIsScanning(false);
      });

      return () => {
        subFound.remove();
        subDone.remove();
      };
    } catch (e) {
      // ignore
    }
  }, []);

  const scanDevices = async () => {
    setIsScanning(true);
    setDevices([]);
    try {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        Alert.alert('Bluetooth Mati', 'Nyalakan Bluetooth terlebih dahulu.');
        setIsScanning(false);
        return;
      }
      await RNBluetoothClassic.startDiscovery();
      setTimeout(async () => {
        try {
          await (RNBluetoothClassic as any).stopDiscovery();
        } catch {}
        setIsScanning(false);
      }, 10000);
    } catch (err: any) {
      setIsScanning(false);
      Alert.alert('Gagal Scan', err?.message || 'Pastikan Bluetooth aktif.');
    }
  };

  const loadBonded = async () => {
    try {
      const bonded = await getBondedDevices();
      setDevices(bonded);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memuat perangkat yang sudah terpasang.');
    }
  };

  const savePrinter = async (device: any) => {
    if (!device.address) {
      Alert.alert('Tidak Valid', 'Alamat perangkat tidak ditemukan.');
      return;
    }
    await AsyncStorage.setItem('printerAddress', device.address);
    setSavedAddress(device.address);
    Alert.alert('Sukses', `Printer ${device.name || 'perangkat'} berhasil ditentukan.`);
  };

  const handleTest = async (address: string) => {
    setTestingId(address);
    try {
      const ok = await testPrinterConnection(address);
      if (ok) {
        Alert.alert('Berhasil', 'Struk test berhasil dikirim ke printer.');
      } else {
        Alert.alert('Gagal', 'Tidak bisa terhubung ke printer. Pastikan printer menyala dan sudah dipairing sebelumnya.');
      }
    } finally {
      setTestingId(null);
    }
  };

  const handleTestSaved = async () => {
    if (!savedAddress) return;
    setTestingId(savedAddress);
    try {
      const ok = await testPrinterConnection(savedAddress);
      if (ok) {
        Alert.alert('Berhasil', 'Printer terhubung dan respons.');
      } else {
        Alert.alert('Gagal', 'Gagal cetak test. Cek power printer atau pairing.');
      }
    } finally {
      setTestingId(null);
    }
  };

  const disconnect = async () => {
    await disconnectAll();
    await AsyncStorage.removeItem('printerAddress');
    setSavedAddress(null);
    Alert.alert('Info', 'Printer terputus.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Printer Thermal 🖨️</Text>
        <Text style={styles.headerSub}>
          {savedAddress ? 'Printer aktif:' : 'Belum ada printer yang dipilih'}
        </Text>
        {savedAddress && (
          <Text style={styles.savedAddr}>{savedAddress}</Text>
        )}
        <View style={styles.headerActions}>
          {savedAddress && (
            <>
              <TouchableOpacity style={styles.testBtn} onPress={handleTestSaved} disabled={!!testingId}>
                <Text style={styles.testBtnText}>{testingId === savedAddress ? 'Menguji...' : 'Test Koneksi'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
                <Text style={styles.disconnectText}>Putuskan</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.bondedBtn} onPress={loadBonded}>
            <Text style={styles.bondedBtnText}>Perangkat Terpasang</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.scanBtn} onPress={scanDevices} disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanBtnText}>Cari Perangkat Bluetooth</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Tekan tombol di atas untuk mencari printer thermal.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deviceCard, savedAddress === item.address && styles.deviceActive]}
            onPress={() => savePrinter(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{item.name || 'Perangkat Tidak Dikenal'}</Text>
              <Text style={styles.deviceAddr}>{item.address}</Text>
            </View>
            {savedAddress === item.address && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Terhubung</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.testItemBtn}
              onPress={() => handleTest(item.address)}
              disabled={testingId === item.address}
            >
              <Text style={styles.testItemBtnText}>
                {testingId === item.address ? 'Tes...' : 'Test'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerCard: {
    backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 18,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '600' },
  savedAddr: {
    fontSize: 12, color: '#2563EB', marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  testBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  testBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  disconnectBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  disconnectText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  bondedBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  bondedBtnText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  scanBtn: {
    marginHorizontal: 16, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', marginBottom: 8,
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40, paddingHorizontal: 24 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16,
    borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 10,
  },
  deviceActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  deviceAddr: { fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  activeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeText: { color: '#15803D', fontWeight: '700', fontSize: 12 },
  testItemBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  testItemBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
});
