import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useCartStore } from '../store/cartStore';
import { createOrder } from '../services/orderService';
import { database } from '../database';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import LogoutIcon from '../assets/icons/logout.svg';

type Props = { navigation: any; onLogoutSuccess: () => void };
const { width } = Dimensions.get('window');
const numColumns = width > 768 ? 4 : width > 480 ? 3 : 2;

const jalankanCetakStruk = async (itemsBelanja: any[], totalHarga: number) => {
  try {
    const printerAddress = await AsyncStorage.getItem('printerAddress');
    if (!printerAddress) return;
    const connected = await RNBluetoothClassic.connectToDevice(printerAddress);
    if (connected) {
      const ESC = '\u001b';
      let struk = `${ESC}@${ESC}a\u0001KASIR PINTAR\n${ESC}a\u0000--------------------------------\n`;
      itemsBelanja.forEach(i => {
        struk +=
          `${i.name}\n${i.quantity} x ${i.price.toLocaleString(
            'id-ID',
          )}`.padEnd(24) +
          `${(i.quantity * i.price).toLocaleString('id-ID')}\n`;
      });
      struk += `--------------------------------\nTOTAL: Rp ${totalHarga.toLocaleString(
        'id-ID',
      )}\n\nTerima Kasih\n\n\n`;
      await RNBluetoothClassic.writeToDevice(printerAddress, struk);
      await RNBluetoothClassic.disconnectFromDevice(printerAddress);
    }
  } catch {}
};

export default function HomeScreen({ navigation, onLogoutSuccess }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, addItem, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    const sub = database
      .get('products')
      .query()
      .observe()
      .subscribe(data => {
        setProducts(data);
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [products, searchQuery],
  );

  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async () => {
    if (!items.length) return;
    try {
      await createOrder('kasir_01', totalPrice, items);
      await jalankanCetakStruk(items, totalPrice);
      clearCart();
      Alert.alert('Sukses', 'Transaksi berhasil');
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Yakin?', [
      { text: 'Batal' },
      {
        text: 'Keluar',
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          onLogoutSuccess();
        },
      },
    ]);
  };

  const renderProduct = ({ item: p }: any) => {
    const cartItem = items.find(i => i.productId === p.id);
    const qty = cartItem?.quantity || 0;
    const stock = Number(p.stock || 0);
    const lowStock = stock <= 3;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text numberOfLines={2} style={styles.name}>
            {p.name}
          </Text>
          <Text style={[styles.stock, lowStock && { color: '#EF4444' }]}>
            Stok {stock}
          </Text>
        </View>
        <Text style={styles.price}>
          Rp {Number(p.price).toLocaleString('id-ID')}
        </Text>

        {qty > 0 ? (
          <View style={styles.counter}>
            <TouchableOpacity
              onPress={() => removeItem(p.id)}
              style={styles.cBtn}
            >
              <Text style={styles.cMinus}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cText}>{qty}</Text>
            <TouchableOpacity
              disabled={qty >= stock}
              onPress={() =>
                addItem({
                  productId: p.id,
                  name: p.name,
                  price: Number(p.price),
                  quantity: 1,
                })
              }
              style={[
                styles.cBtn,
                styles.cPlus,
                qty >= stock && { opacity: 0.4 },
              ]}
            >
              <Text style={styles.cPlusT}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            disabled={stock <= 0}
            onPress={() =>
              addItem({
                productId: p.id,
                name: p.name,
                price: Number(p.price),
                quantity: 1,
              })
            }
            style={[styles.add, stock <= 0 && { backgroundColor: '#E2E8F0' }]}
          >
            <Text style={[styles.addT, stock <= 0 && { color: '#94A3B8' }]}>
              {stock <= 0 ? 'Habis' : 'Tambah'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Kasir</Text>
          <Text style={styles.sub}>Pilih produk pelanggan</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleLogout} style={styles.logout}>
            <LogoutIcon width={18} height={18} fill="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.search}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* GRID */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          key={numColumns}
          numColumns={numColumns}
          renderItem={renderProduct}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* CART BAR */}
      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartLabel}>{totalItems} item</Text>
            <Text style={styles.cartTotal}>
              Rp {totalPrice.toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCheckout} style={styles.payBtn}>
            <Text style={styles.payText}>Bayar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  hi: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logout: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  search: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 15,
    color: '#0F172A',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  stock: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 12,
  },
  add: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addT: { color: '#fff', fontWeight: '700', fontSize: 14 },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    justifyContent: 'space-between',
  },
  cBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cMinus: { fontSize: 20, color: '#EF4444', fontWeight: '700', marginTop: -2 },
  cPlus: { backgroundColor: '#3B82F6' },
  cPlusT: { fontSize: 18, color: '#fff', fontWeight: '700', marginTop: -1 },
  cText: { fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cartLabel: { color: '#94A3B8', fontSize: 12 },
  cartTotal: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  payBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  payText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
