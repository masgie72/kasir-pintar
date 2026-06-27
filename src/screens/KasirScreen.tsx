import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { useCartStore } from '../store/cartStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchIcon from '../assets/icons/Search Icon.svg';
import CartIcon from '../assets/icons/Cart Icon.svg';

const { width } = Dimensions.get('window');
const numColumns = width > 768 ? 3 : 2;

export default function KasirScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { items, addItem, removeItem, getTotalPrice } = useCartStore();

  useEffect(() => {
    let activeSub: any;
    let fallbackSub: any;
    let fallbackCreated = false;

    const setup = async () => {
      const baseQuery = database
        .get('products')
        .query(
          Q.where('is_active', true),
          Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`)),
        );

      activeSub = baseQuery.observe().subscribe({
        next: (data: any[]) => {
          if (data.length > 0) {
            setProducts(data);
            setLoading(false);
          } else if (!fallbackCreated) {
            fallbackCreated = true;
            const fallbackQuery = database
              .get('products')
              .query(Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`)));
            fallbackSub = fallbackQuery.observe().subscribe({
              next: (fallbackData: any[]) => {
                setProducts(fallbackData);
                setLoading(false);
              },
              error: () => setLoading(false),
            });
          }
        },
        error: () => setLoading(false),
      });
    };

    setup();

    return () => {
      if (activeSub) activeSub.unsubscribe();
      if (fallbackSub) fallbackSub.unsubscribe();
    };
  }, [searchQuery]);

  const handleCheckout = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    navigation.navigate('Checkout', { userId: userId || 'local_user' });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = getTotalPrice();

  const renderProduct = ({ item }: { item: any }) => {
    const cartItem = items.find(i => i.productId === item.id);
    const qty = cartItem?.quantity || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardIconWrap}>
            <Text style={styles.cardEmoji}>📦</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item.stock !== undefined && (
            <View style={[styles.stockBadge, item.stock <= 5 ? styles.stockLow : styles.stockNormal]}>
              <Text style={[styles.stockText, item.stock <= 5 ? styles.stockTextLow : styles.stockTextNormal]}>
                Stok: {item.stock}
              </Text>
            </View>
          )}
          <Text style={styles.price}>
            Rp {Number(item.price).toLocaleString('id-ID')}
          </Text>
        </View>

        {qty > 0 ? (
          <View style={styles.counterWrap}>
            <TouchableOpacity
              onPress={() => removeItem(item.id.toString())}
              style={styles.cBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cBtnMinus}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cText}>{qty}</Text>
            <TouchableOpacity
              onPress={() =>
                 addItem({
                   productId: item.id.toString(),
                   name: item.name,
                   price: item.price,
                   costPrice: item.costPrice || 0,
                   quantity: 1,
                 })
               }
               style={styles.cPlus}
               activeOpacity={0.7}
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
                 costPrice: item.costPrice || 0,
                 quantity: 1,
               })
             }
             style={styles.addBtn}
             activeOpacity={0.85}
           >
             <Text style={styles.addBtnText}>Tambah</Text>
           </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Kasir</Text>
          <Text style={styles.headerSubtitle}>Pilih produk untuk dibeli</Text>
        </View>
        <TouchableOpacity style={styles.cartIconBtn} onPress={handleCheckout}>
          <View style={styles.cartIconWrap}>
            <CartIcon width={22} height={22} fill="#2563EB" />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <SearchIcon width={18} height={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PRODUCT GRID */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Memuat produk...</Text>
        </View>
      ) : (
        <FlashList
          data={products}
          renderItem={renderProduct}
          estimatedItemSize={160}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
              <Text style={styles.emptySub}>Coba kata kunci lain</Text>
            </View>
          }
        />
      )}

      {/* CART BAR */}
      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <View style={styles.cartMetaRow}>
              <View style={styles.cartDot} />
              <Text style={styles.cartLabel}>{totalItems} item</Text>
            </View>
            <Text style={styles.cartTotal}>
              Rp {totalPrice.toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handleCheckout} activeOpacity={0.85}>
            <Text style={styles.payBtnText}>Bayar</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  cartIconBtn: { padding: 6 },
  cartIconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
  },
  searchIcon: { marginRight: 8, tintColor: '#94A3B8' },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: { padding: 4, marginLeft: 4 },
  clearText: { fontSize: 15, color: '#94A3B8', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 140 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 14, fontWeight: '500' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 150,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBody: { flex: 1 },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 18 },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 6,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  stockNormal: { backgroundColor: '#DCFCE7' },
  stockLow: { backgroundColor: '#FEE2E2' },
  stockText: { fontSize: 11, fontWeight: '700' },
  stockTextNormal: { color: '#15803D' },
  stockTextLow: { color: '#B91C1C' },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
    height: 36,
  },
  cBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  cBtnMinus: { fontSize: 16, fontWeight: '700', color: '#475569' },
  cText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cPlus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  cPlusT: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  cartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  cartInfo: { flex: 1 },
  cartMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cartDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  cartLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  cartTotal: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  payBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  payBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
});
