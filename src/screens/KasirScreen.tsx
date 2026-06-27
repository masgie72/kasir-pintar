import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { useCartStore } from '../store/cartStore';

const { width } = Dimensions.get('window');
const numColumns = width > 768 ? 4 : 2;

export default function KasirScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, addItem, removeItem, getTotalPrice, clearCart } =
    useCartStore();

  // 1. Data fetching reaktif dengan WatermelonDB
  useEffect(() => {
    const query = database
      .get('products')
      .query(
        Q.where('is_active', true),
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`)),
      );

    const subscription = query.observe().subscribe(data => {
      setProducts(data);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [searchQuery]);

  // 2. Render item yang clean
  const renderProduct = ({ item }: { item: any }) => {
    const cartItem = items.find(i => i.productId === item.id);
    const qty = cartItem?.quantity || 0;

    return (
      <View style={styles.card}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          Rp {Number(item.price).toLocaleString('id-ID')}
        </Text>

        {qty > 0 ? (
          <View style={styles.counter}>
            <TouchableOpacity
              onPress={() => removeItem(item.id.toString())}
              style={styles.cBtn}
            >
              <Text>–</Text>
            </TouchableOpacity>
            <Text style={styles.cText}>{qty}</Text>
            <TouchableOpacity
              onPress={() =>
                addItem({
                  productId: item.id.toString(),
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                })
              }
              style={[styles.cBtn, styles.cPlus]}
            >
              <Text style={styles.cPlusT}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() =>
              addItem({
                productId: item.id.toString(),
                name: item.name,
                price: item.price,
                quantity: 1,
              })
            }
            style={styles.add}
          >
            <Text style={styles.addT}>Tambah</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TextInput
        style={styles.search}
        placeholder="Cari produk..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlashList<any>
          data={products}
          renderItem={renderProduct}
          estimatedItemSize={140}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        />
      )}

      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartLabel}>Total Belanja</Text>
            <Text style={styles.cartTotal}>
              Rp {getTotalPrice().toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => Alert.alert('Checkout', 'Proses pembayaran...')}
          >
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
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  hi: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  cardTop: { marginBottom: 6 },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },

  stock: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 12,
  },
  add: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addT: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cMinus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  cPlus: {
    backgroundColor: '#3B82F6',
  },
  cPlusT: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cartLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  cartTotal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  payText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
