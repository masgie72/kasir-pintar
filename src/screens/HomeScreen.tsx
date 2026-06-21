
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useCartStore } from '../store/cartStore';
import { createOrder } from '../services/orderService';
import { database } from '../database';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

type Props = {
  navigation: any;
  onLogoutSuccess: () => void;
};
const jalankanCetakStruk = async (itemsBelanja: any[], totalHarga: number) => {
  try {
    const printerAddress = await AsyncStorage.getItem('printerAddress');
    if (!printerAddress) {
      Alert.alert('Printer Belum Disetting', 'Silakan masuk ke halaman Pengaturan untuk menautkan printer.');
      return;
    }

    const connected = await RNBluetoothClassic.connectToDevice(printerAddress);
    if (connected) {
      const ESC = '\u001b';
      let struk = `${ESC}@${ESC}a\u0001`; // Inisialisasi + Rata Tengah
      struk += "KASIR PINTAR TOKO\n";
      struk += "Transaksi Penjualan Baru\n";
      struk += "--------------------------------\n";
      
      struk += `${ESC}a\u0000`; // Rata Kiri
      itemsBelanja.forEach((item) => {
        struk += `${item.name.slice(0, 32)}\n`;
        const detail = `${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}`;
        const sub = `Rp ${(item.quantity * item.price).toLocaleString('id-ID')}`;
        const spasi = ' '.repeat(Math.max(1, 32 - (detail.length + sub.length)));
        struk += `${detail}${spasi}${sub}\n`;
      });
      
      struk += "--------------------------------\n";
      const lbl = "TOTAL:";
      const val = `Rp ${totalHarga.toLocaleString('id-ID')}`;
      const spasiTotal = ' '.repeat(Math.max(1, 32 - (lbl.length + val.length)));
      struk += `${lbl}${spasiTotal}${val}\n\n`;
      struk += `${ESC}a\u0001Terima Kasih 🙏\n\n\n\n`;

      await RNBluetoothClassic.writeToDevice(printerAddress, struk);
      await RNBluetoothClassic.disconnectFromDevice(printerAddress);
    }
  } catch (error) {
    console.error('Gagal cetak otomatis:', error);
  }
};

export default function HomeScreen({ navigation, onLogoutSuccess }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mengambil fungsi keranjang dari store
  const { items, addItem, removeItem, clearCart } = useCartStore();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scanForPrinters = async () => {
    try {
      let enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
      }
      let devices = await RNBluetoothClassic.startDiscovery();
      Alert.alert('Printer', `Ditemukan ${devices.length} perangkat Bluetooth.`);
      return devices;
    } catch (error) {
      console.error('Gagal scan:', error);
    }
  };

  useEffect(() => {
    console.log('Bluetooth Classic terdeteksi:', !!RNBluetoothClassic);
  }, []);

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          onLogoutSuccess();
        },
      },
    ]);
  };

  useEffect(() => {
    const productsCollection = database.get('products');
    const subscription = productsCollection
      .query()
      .observe()
      .subscribe(data => {
        setProducts(data);
        setLoading(false);
      });
    return () => subscription.unsubscribe();
  }, []);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      await createOrder('kasir_01', totalPrice, items);

      await jalankanCetakStruk(items, totalPrice);
      
      clearCart();
      Alert.alert('Sukses 🎉', 'Transaksi berhasil disimpan!');
    } catch (error: any) {
      console.error('Detail Error dari Database:', error);
      Alert.alert(
        'Gagal Menyimpan',
        `Detail: ${error?.message || 'Terjadi kesalahan sistem pada database.'}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      
      {/* 1. TOP BAR PROFIL (Gaya Modern) */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarPlaceholder}
            onPress={() => navigation.navigate('Setting')}
          >
            <Text style={styles.avatarText}>⚙️</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}>Selamat Datang,</Text>
            <Text style={styles.headerTitle}>Kasir Pintar 💼</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* 2. BARIS MENU NAVIGASI QUICK ACTIONS */}
      <View style={styles.menuRow}>
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#E0F2FE' }]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.menuIcon}>📜</Text>
          <Text style={[styles.menuButtonText, { color: '#0369A1' }]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#EEF2FF' }]}
          onPress={() => navigation.navigate('Product')}
        >
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={[styles.menuButtonText, { color: '#4338CA' }]}>Produk</Text>
        </TouchableOpacity>

        <TouchableOpacity
         style={[styles.menuButton, { backgroundColor: '#ECFDF5' }]}
  onPress={() => navigation.navigate('PrinterSetting')}
        >
          <Text style={styles.menuIcon}>🖨️</Text>
          <Text style={[styles.menuButtonText, { color: '#047857' }]}>Printer</Text>
        </TouchableOpacity>
      </View>

      {/* 3. KOLOM PENCARIAN PRODUK */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama produk..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. DAFTAR PRODUK DENGAN VALIDASI STOK */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#3B82F6" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
            </View>
          ) : (
            filteredProducts.map(p => {
              const cartItem = items.find(item => item.productId === p.id);
              const currentQty = cartItem ? cartItem.quantity : 0;
              const availableStock = Number(p.stock || 0);

              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productPrice}>
                      Rp {Number(p.price).toLocaleString('id-ID')}
                    </Text>
                    <Text style={{ fontSize: 12, color: availableStock <= 3 ? '#EF4444' : '#64748B', marginTop: 2 }}>
                      Stok: {availableStock}
                    </Text>
                  </View>

                  {/* Logika Kontroler Tombol Plus-Minus */}
                  {currentQty > 0 ? (
                    <View style={styles.counterContainer}>
                      <TouchableOpacity style={styles.minusButton} onPress={() => removeItem(p.id)}>
                        <Text style={styles.minusButtonText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.counterText}>{currentQty}</Text>

                      <TouchableOpacity
                        style={[
                          styles.plusButton,
                          currentQty >= availableStock && { backgroundColor: '#CBD5E1' }
                        ]}
                        onPress={() => {
                          if (currentQty >= availableStock) {
                            Alert.alert('Stok Habis ⚠️', `Jumlah ${p.name} di keranjang sudah maksimal.`);
                            return;
                          }
                          addItem({
                            productId: p.id,
                            name: p.name,
                            price: Number(p.price),
                            quantity: 1,
                          });
                        }}
                        disabled={currentQty >= availableStock}
                      >
                        <Text style={styles.plusButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        availableStock <= 0 && { backgroundColor: '#CBD5E1', borderColor: '#CBD5E1' }
                      ]}
                      onPress={() => {
                        if (availableStock <= 0) {
                          Alert.alert('Stok Kosong ⚠️', `Produk ${p.name} sedang tidak tersedia.`);
                          return;
                        }
                        addItem({
                          productId: p.id,
                          name: p.name,
                          price: Number(p.price),
                          quantity: 1,
                        });
                      }}
                      disabled={availableStock <= 0}
                    >
                      <Text style={[styles.addButtonText, availableStock <= 0 && { color: '#94A3B8' }]}>
                        {availableStock <= 0 ? 'Habis' : '+ Tambah'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* 5. KERANJANG BELANJA BAWAH STICKY BOTTOM */}
      <View style={styles.bottomBar}>
        <View style={styles.cartInfo}>
          <Text style={styles.cartItemsText}>{items.length} Item dipilih</Text>
          <Text style={styles.cartTotalPrice}>Rp {totalPrice.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, items.length === 0 && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.checkoutText}>Bayar 💳</Text>
		          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
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
  profileSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
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
  avatarText: { 
    fontSize: 16 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '500' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginTop: 1 
  },
  logoutButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    backgroundColor: '#FEE2E2', 
    borderRadius: 10 
  },
  logoutText: { 
    color: '#EF4444', 
    fontWeight: '700', 
    fontSize: 13 
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  menuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIcon: { 
    fontSize: 15 
  },
  menuButtonText: { 
    fontSize: 12, 
    fontWeight: '700' 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchIcon: { 
    marginRight: 8, 
    fontSize: 15 
  },
  searchInput: { 
    flex: 1, 
    color: '#0F172A', 
    fontSize: 15, 
    padding: 0 
  },
  clearButton: { 
    padding: 4 
  },
  clearButtonText: { 
    color: '#94A3B8', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  scrollContainer: { 
    padding: 16, 
    paddingBottom: 110 
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  productInfo: { 
    flex: 1 
  },
  productName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1E293B', 
    marginBottom: 4 
  },
  productPrice: { 
    fontSize: 14, 
    color: '#3B82F6', 
    fontWeight: '600' 
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addButtonText: { 
    color: '#1D4ED8', 
    fontWeight: '700', 
    fontSize: 14 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 50, 
    paddingVertical: 20 
  },
  emptyIcon: { 
    fontSize: 40, 
    marginBottom: 8, 
    opacity: 0.6 
  },
  emptyText: { 
    color: '#64748B', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  minusButton: { 
    backgroundColor: '#FFFFFF', 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  minusButtonText: { 
    color: '#EF4444', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  counterText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0F172A', 
    paddingHorizontal: 14, 
    textAlign: 'center', 
    minWidth: 40 
  },
  plusButton: { 
    backgroundColor: '#3B82F6', 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  plusButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 15,
  },
  cartInfo: { 
    flex: 1 
  },
  cartItemsText: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '500', 
    marginBottom: 2 
  },
  cartTotalPrice: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  checkoutButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  checkoutButtonDisabled: { 
    backgroundColor: '#CBD5E1', 
    elevation: 0, 
    shadowOpacity: 0 
  },
  checkoutText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
});

