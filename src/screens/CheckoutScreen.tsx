
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

export default function CheckoutScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const productsCollection = database.get('products');
    const subscription = productsCollection
      .query()
      .observe()
      .subscribe(setProducts);
    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { ...product, productId: product.id, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await createOrder('user_1', total, cart);
    setCart([]);
    Alert.alert('Sukses', 'Transaksi berhasil!');
    navigation.navigate('History');
  };
  /**
 * Format string agar rapi (32 karakter)
 * Nama Barang (kiri) ..... Harga (kanan)
 */

  return (
    <View style={styles.container}>
      {/* 1. Daftar Produk untuk Dipilih */}
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

      {/* 2. Keranjang Belanja */}
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

        {/* 3. Total & Bayar */}
        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Total: Rp{' '}
            {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
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

export default function CheckoutScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const productsCollection = database.get('products');
    const subscription = productsCollection
      .query()
      .observe()
      .subscribe(setProducts);
    return () => subscription.unsubscribe();
  }, []);

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prevCart, { ...product, productId: product.id, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await createOrder('user_1', total, cart);
    setCart([]);
    Alert.alert('Sukses', 'Transaksi berhasil!');
    navigation.navigate('History');
  };
  /**
 * Format string agar rapi (32 karakter)
 * Nama Barang (kiri) ..... Harga (kanan)
 */

  return (
    <View style={styles.container}>
      {/* 1. Daftar Produk untuk Dipilih */}
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

      {/* 2. Keranjang Belanja */}
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

        {/* 3. Total & Bayar */}
        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Total: Rp{' '}
            {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
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

