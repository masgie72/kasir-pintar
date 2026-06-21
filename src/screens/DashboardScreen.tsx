import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Q, Collection } from '@nozbe/watermelondb';
import { database } from '../database';

import Order from '../database/models/Order';
import Product from '../database/models/Product';

type Stat = { label: string; value: string; color: string };

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = async () => {
      // kasih tipe biar TS kenal field-nya
      const products: Collection<Product> = database.get<Product>('products');
      const orders: Collection<Order> = database.get<Order>('orders');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = today.getTime();

      const [productCount, lowStock, todayOrders] = await Promise.all([
        products.query().fetchCount(),
        products.query(Q.where('stock', Q.lt(5))).fetchCount(),
        orders.query(Q.where('created_at', Q.gte(todayTs))).fetch(),
      ]);

      const totalHariIni = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      setStats([
        { label: 'Penjualan Hari Ini', value: `Rp ${totalHariIni.toLocaleString('id-ID')}`, color: '#4F46E5' },
        { label: 'Order Hari Ini', value: `${todayOrders.length}`, color: '#059669' },
        { label: 'Produk Aktif', value: `${productCount}`, color: '#DC2626' },
        { label: 'Stok Menipis', value: `${lowStock}`, color: '#EA580C' },
      ]);

      const recent = await orders.query(
        Q.sortBy('created_at', Q.desc),
        Q.take(5)
      ).fetch();
      setRecentOrders(recent);
    };

    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const menus = [
    { title: 'Produk', icon: '📦', screen: 'Products' },
    { title: 'Kasir', icon: '🧾', screen: 'Cashier' },
    { title: 'Laporan', icon: '📊', screen: 'Reports' },
    { title: 'Pengguna', icon: '👤', screen: 'Users' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard Kasir Pintar</Text>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.card, { borderLeftColor: s.color }]}>
            <Text style={styles.cardLabel}>{s.label}</Text>
            <Text style={styles.cardValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Menu Cepat</Text>
      <View style={styles.menuGrid}>
        {menus.map(m => (
          <TouchableOpacity key={m.title} style={styles.menuItem} onPress={() => navigation.navigate(m.screen)}>
            <Text style={styles.menuIcon}>{m.icon}</Text>
            <Text style={styles.menuText}>{m.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Order Terbaru</Text>
      <FlatList
        data={recentOrders}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.orderRow}>
            <View>
              <Text style={styles.orderId}>#{item.id.slice(0, 6)}</Text>
              {/* createdAt sudah Date karena pakai @date */}
              <Text style={styles.orderDate}>{item.createdAt.toLocaleString('id-ID')}</Text>
            </View>
            <Text style={styles.orderTotal}>Rp {(item.totalPrice || 0).toLocaleString('id-ID')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada order</Text>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#0F172A' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: 'white', width: '48%', padding: 14, borderRadius: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 12, color: '#64748B' },
  cardValue: { fontSize: 18, fontWeight: '700', marginTop: 4, color: '#0F172A' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8, color: '#0F172A' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItem: { backgroundColor: 'white', width: '22%', aspectRatio: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  menuIcon: { fontSize: 24 },
  menuText: { fontSize: 12, marginTop: 6, color: '#334155' },
  orderRow: { backgroundColor: 'white', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: '600', color: '#0F172A' },
  orderDate: { fontSize: 12, color: '#64748B' },
  orderTotal: { fontWeight: '700', color: '#059669' },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 12 },
});
