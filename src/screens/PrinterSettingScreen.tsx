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
import { useTheme } from '../theme/ThemeContext';

export default function PrinterSettingScreen({ navigation }: any) {
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* CUSTOM APP BAR */}
      <View style={[styles.appBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.appBarTitle, { color: theme.text }]}>Pengaturan Printer 🖨️</Text>
          <Text style={[styles.appBarSub, { color: theme.textSecondary }]}>
            Kelola perangkat thermal
          </Text>
        </View>
      </View>

      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Printer Thermal 🖨️</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          {savedAddress ? 'Printer aktif:' : 'Belum ada printer yang dipilih'}
        </Text>
        {savedAddress && (
          <Text style={[styles.savedAddr, { color: theme.primary }]}>{savedAddress}</Text>
        )}
        <View style={styles.headerActions}>
          {savedAddress && (
            <>
              <TouchableOpacity style={[styles.testBtn, { backgroundColor: theme.primaryLight }]} onPress={handleTestSaved} disabled={!!testingId}>
                <Text style={[styles.testBtnText, { color: theme.primary }]}>{testingId === savedAddress ? 'Menguji...' : 'Test Koneksi'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.disconnectBtn, { backgroundColor: theme.dangerLight }]} onPress={disconnect}>
                <Text style={[styles.disconnectText, { color: theme.danger }]}>Putuskan</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={[styles.bondedBtn, { backgroundColor: theme.borderLight }]} onPress={loadBonded}>
            <Text style={[styles.bondedBtnText, { color: theme.textSecondary }]}>Perangkat Terpasang</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.scanBtn, { backgroundColor: theme.primary }]} onPress={scanDevices} disabled={isScanning}>
        {isScanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.scanBtnText, { color: '#fff' }]}>Cari Perangkat Bluetooth</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={item => item.address}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>Tekan tombol di atas untuk mencari printer thermal.</Text>
        }
        renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.deviceCard,
                savedAddress === item.address && { borderColor: theme.primary },
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => savePrinter(item)}
            >
            <View style={{ flex: 1 }}>
              <Text style={[styles.deviceName, { color: theme.text }]}>{item.name || 'Perangkat Tidak Dikenal'}</Text>
              <Text style={[styles.deviceAddr, { color: theme.textSecondary }]}>{item.address}</Text>
            </View>
            {savedAddress === item.address && (
              <View style={[styles.activeBadge, { backgroundColor: theme.successLight }]}>
                <Text style={[styles.activeText, { color: theme.success }]}>Terhubung</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.testItemBtn, { backgroundColor: theme.primaryLight }]}
              onPress={() => handleTest(item.address)}
              disabled={testingId === item.address}
            >
              <Text style={[styles.testItemBtnText, { color: theme.primary }]}>
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
  container: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { fontSize: 22, fontWeight: '700' },
  appBarTitle: { fontSize: 18, fontWeight: '800' },
  appBarSub: { fontSize: 12, marginTop: 1 },
  headerCard: {
    margin: 16, padding: 20, borderRadius: 18,
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  savedAddr: {
    fontSize: 12, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  testBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  testBtnText: { fontWeight: '700', fontSize: 13 },
  disconnectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  disconnectText: { fontWeight: '700', fontSize: 13 },
  bondedBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  bondedBtnText: { fontWeight: '700', fontSize: 13 },
  scanBtn: {
    marginHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', marginBottom: 8,
  },
  scanBtnText: { fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, marginBottom: 10, borderWidth: 1, gap: 10,
  },
  deviceName: { fontSize: 15, fontWeight: '700' },
  deviceAddr: { fontSize: 12, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeText: { fontWeight: '700', fontSize: 12 },
  testItemBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  testItemBtnText: { fontWeight: '700', fontSize: 12 },
});
