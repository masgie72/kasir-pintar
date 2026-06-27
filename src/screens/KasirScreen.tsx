import React, { useEffect, useState, useMemo } from 'react'; 
 import { View, Text, StyleSheet, Alert, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Dimensions, Platform, } 
 from 'react-native'; import { useCartStore } from '../store/cartStore'; 
 import { createOrder } from '../services/orderService'; import { database } from '../database'; 
 import { SafeAreaView } from 'react-native-safe-area-context'; 
 import AsyncStorage from '@react-native-async-storage/async-storage'; 
 import RNBluetoothClassic from 'react-native-bluetooth-classic'; 
 import LogoutIcon from '../assets/icons/logout.svg'; 
 interface Product { id: number; name: string; price: number; stock: number; } interface CartItem { productId: number; name: string; price: number; quantity: number; } interface RouteParams { onLogoutSuccess?: () => void; } const { width } = Dimensions.get('window'); const numColumns = width > 768 ? 4 : width > 480 ? 3 : 2; const jalankanCetakStruk = async (itemsBelanja: Product[], totalHarga: number) => 
 { 
 try { 
 const printerAddress = await AsyncStorage.getItem('printerAddress'); if (!printerAddress) return; const connected = await RNBluetoothClassic.connectToDevice(printerAddress); if (connected) { 
 const ESC = '\u001b'; let struk = ${ESC}@${ESC}a\u0001KASIR PINTAR\n${ESC}a\u0000--------------------------------\n; 
 itemsBelanja.forEach(i => { 
 struk += ${i.name}\n${i.quantity} x ${i.price.toLocaleString( 'id-ID', )}.padEnd(24) + ${(i.quantity i.price).toLocaleString('id-ID')}\n; }); 
 struk += --------------------------------\nTOTAL: Rp ${totalHarga.toLocaleString( 'id-ID', )}\n\nTerima Kasih\n\n\n; 
 await RNBluetoothClassic.writeToDevice(printerAddress, struk); 
 await RNBluetoothClassic.disconnectFromDevice(printerAddress); } 
 } catch {
 } }; 
 export default function KasirScreen({ navigation, route }: { 
 route: { params: RouteParams }; navigation: any }) { 
 const [searchQuery, setSearchQuery] = useState<string>(''); 
 const [products, setProducts] = useState<Product[]>([]); 
 const [loading, setLoading] = useState<boolean>(true); 
 const { items, addItem, removeItem, clearCart } = useCartStore(); useEffect(() => { 
 const sub = database .get('products') .query() .observe() .subscribe(data => { setProducts(data); 
 setLoading(false); }); 
 return () => sub.unsubscribe(); }, []); 
 const filtered = useMemo( () => products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()), ), [products, searchQuery], ); 
 const totalPrice = items.reduce((s, i) => s + i.price i.quantity, 0); 
 const totalItems = items.reduce((s, i) => s + i.quantity, 0); const handleCheckout = async () => { if (!items.length) return; 
 try { 
 const deviceId = (await AsyncStorage.getItem('device_id')) || 'UNKNOWN'; const currentUserId = (await AsyncStorage.getItem('user_id')) || 'SYSTEM_KASIR'; await createOrder(currentUserId, totalPrice, items, deviceId); 
 await jalankanCetakStruk(items, totalPrice); Alert.alert( 'Sukses', 'Transaksi berhasil', [ 
 { text: 'OK', onPress: () => { clearCart(); } } ], { cancelable: false } ); 
 } 
 catch (e: any) { Alert.alert('Gagal', e.message); } }; 
 const handleLogout = async () => { 
 const triggerLogoutPusat = route.params?.onLogoutSuccess; 
 Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [ { text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: async () => { 
 try { 
 await AsyncStorage.removeItem('isLoggedIn'); 
 await AsyncStorage.removeItem('user_role'); 
 await AsyncStorage.removeItem('user_name'); 
 if (triggerLogoutPusat) { triggerLogoutPusat(); } 
 } catch (e) { 
 Alert.alert('Error', 'Gagal memproses logout.'); } }, }, ]); }; 
 const renderProduct = ({ item: p }: { item: Product }) => { 
 const cartItem = items.find(i => i.productId === p.id); const qty = cartItem?.quantity || 0; const stock = Number(p.stock || 0); const lowStock = stock <= 3; 
 return ( 
 <View style={styles.card} key={p.id}> <View style={styles.cardTop}> <Text numberOfLines={2} style={styles.name}> {p.name} </Text> 
 <Text style={[styles.stock, lowStock && { color: '#EF4444' }]}> Stok {stock} </Text> 
 </View> 
 <Text style={styles.price}> Rp {Number(p.price).toLocaleString('id-ID')} </Text> {qty > 0 ? ( <View style={styles.counter}> 
 <TouchableOpacity onPress={() => removeItem(p.id)} style={styles.cBtn} > <Text style={styles.cMinus}>−</Text> 
 </TouchableOpacity> 
 <Text style={styles.cText}>{qty}</Text> 
 <TouchableOpacity disabled={qty >= stock} onPress={() => addItem({ 
 productId: p.id, name: 
 p.name, price: Number(p.price), 
 quantity: 1, }) } style={[ styles.cBtn, styles.cPlus, qty >= stock && { opacity: 0.4 }, ]} > 
 <Text style={styles.cPlusT}>+</Text> 
 </TouchableOpacity> </View> 
 ) : ( 
 <TouchableOpacity disabled={stock <= 0} onPress={() => addItem({ productId: p.id, name: p.name, price: Number(p.price), quantity: 1, }) } style={[styles.add, stock <= 0 && { backgroundColor: '#E2E8F0' }]} > <Text style={[styles.addT, stock <= 0 && { color: '#94A3B8' }]}> {stock <= 0 ? 'Habis' : 'Tambah'} </Text> </TouchableOpacity> )} </View> ); }; return ( <SafeAreaView style={styles.safe} edges={['top']}> {/ HEADER /} <View style={styles.header}> <View> <Text style={styles.hi}>Kasir</Text> <Text style={styles.sub}>Pilih produk pelanggan</Text> </View> <View style={styles.headerActions}> <TouchableOpacity onPress={handleLogout} style={styles.logout}> <LogoutIcon width={18} height={18} fill="#EF4444" /> </TouchableOpacity> </View> </View> {/ SEARCH /} <View style={styles.searchWrap}> <TextInput placeholder="Cari produk..." value={searchQuery} onChangeText={setSearchQuery} style={styles.search} placeholderTextColor="#94A3B8" /> </View> {/ GRID /} {loading ? ( <ActivityIndicator style={{ marginTop: 40 }} /> ) : ( <FlatList data={filtered} key={numColumns} numColumns={numColumns} renderItem={renderProduct} keyExtractor={p => p.id.toString()} contentContainerStyle={{ padding: 12, paddingBottom: 120 }} columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined} showsVerticalScrollIndicator={false} /> )} {/ CART BAR /} {items.length > 0 && ( <View style={styles.cartBar}> <View> <Text style={styles.cartLabel}>{totalItems} item</Text> <Text style={styles.cartTotal}> Rp {totalPrice.toLocaleString('id-ID')} </Text> </View> <TouchableOpacity onPress={handleCheckout} style={styles.payBtn}> <Text style={styles.payText}>Bayar</Text> </TouchableOpacity> </View> )} </SafeAreaView> ); } const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8FAFC' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9', }, hi: { fontSize: 22, fontWeight: '800', color: '#0F172A' }, sub: { fontSize: 13, color: '#64748B', marginTop: 2 }, headerActions: { flexDirection: 'row', gap: 8 }, logout: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', }, searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#F1F5F9', }, search: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 15, color: '#0F172A', }, card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'space-between', minHeight: 140, }, cardTop: { marginBottom: 6 }, name: { fontSize: 14, fontWeight: '700', color: '#0F172A', lineHeight: 18 }, stock: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '600' }, price: { fontSize: 15, fontWeight: '800', color: '#3B82F6', marginBottom: 12, }, add: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 8, alignItems: 'center', }, addT: { color: '#fff', fontWeight: '700', fontSize: 13 }, counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden', }, cBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', }, cMinus: { fontSize: 16, fontWeight: 'bold', color: '#64748B' }, cPlus: { backgroundColor: '#3B82F6' }, cPlusT: { fontSize: 16, fontWeight: 'bold', color: '#fff' }, cText: { fontSize: 14, fontWeight: '700', color: '#0F172A' }, cartBar: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, }, cartLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' }, cartTotal: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 2 }, payBtn: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, }, payText: { color: '#FFF', fontWeight: '700', fontSize: 15 }, }); 