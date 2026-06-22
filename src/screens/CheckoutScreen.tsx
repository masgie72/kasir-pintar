import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { database } from '../database';
import { createOrder } from '../services/orderService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckoutScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const sub = database
      .get('products')
      .query()
      .observe()
      .subscribe(setProducts);
    return () => sub.unsubscribe();
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exist = prev.find(i => i.productId === product.id);
      if (exist)
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...product, productId: product.id, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const deviceId = await AsyncStorage.getItem('device_id');

    await createOrder('user_1', total, cart, deviceId ?? '');
    setCart([]);
    Alert.alert('Sukses', 'Transaksi berhasil!');
    navigation.navigate('History');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Pilih Produk</Text>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productItem}
            onPress={() => addToCart(item)}
          >
            <Text>
              {item.name} (Rp {item.price})
            </Text>
            <Text style={styles.addButton}>+ Tambah</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.cartContainer}>
        <Text style={styles.sectionTitle}>Keranjang</Text>
        <FlatList
          data={cart}
          keyExtractor={item => item.productId}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text>
                {item.name} x {item.quantity}
              </Text>
              <Text>Rp {item.price * item.quantity}</Text>
            </View>
          )}
        />
        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Total: Rp {cart.reduce((s, i) => s + i.price * i.quantity, 0)}
          </Text>
          <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
            <Text style={styles.payButtonText}>Proses Pembayaran</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 8,
  },
  addButton: { color: '#3B82F6', fontWeight: 'bold' },
  cartContainer: {
    flex: 1,
    borderTopWidth: 2,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  footer: { paddingVertical: 15, borderTopWidth: 1, borderColor: '#ccc' },
  totalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  payButton: {
    backgroundColor: '#10B981',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  payButtonText: { color: '#fff', fontWeight: 'bold' },
});
