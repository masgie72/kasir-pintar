import React, { useEffect, useState } from 'react'; 
 import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, } from 'react-native'; 
 import { database } from '../database'; 
 interface Product { id: number; name: string; price: number; stock: number; } 
 interface RouteParams { productId: number; } 
 export default function EditProductScreen({ route, navigation }: { route: { params: RouteParams }; navigation: any }) { 
 const { productId } = route.params; 
 const [product, setProduct] = useState<Product | null>(null); 
 const [name, setName] = useState(''); 
 const [price, setPrice] = useState(''); 
 const [stock, setStock] = useState(''); 
 useEffect(() => { const loadProductData = async () => { 
 try { 
 const productRecord = (await database.get('products').find(productId)) as Product; 
 setProduct(productRecord); setName(productRecord.name); setPrice(productRecord.price.toString()); 
 setStock(productRecord.stock.toString()); 
 } catch (error) { 
 Alert.alert('Error', 'Gagal memuat detail data produk.'); 
 } }; 
 loadProductData(); }, 
 [productId]); 
 const handleUpdate = async () => { 
 if (!name || isNaN(parseFloat(price)) || isNaN(parseInt(stock))) { 
 Alert.alert('Error', 'Harap lengkapi semua field dengan nilai yang valid.'); 
 return; 
 } 
 try { await database.write(async () => { 
 await product?.update((p: Product) => { 
 p.name = name; 
 p.price = parseFloat(price); 
 p.stock = parseInt(stock); }); }); 
 Alert.alert('Sukses', 'Produk berhasil diperbarui'); 
 navigation.goBack(); 
 } catch (error) { 
 Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan data.'); 
 } }; 
 return ( 
 <View style={styles.container}> 
 <TextInput style={styles.input} 
 value={name} 
 onChangeText={setName} 
 placeholder="Nama Produk" /> 
 <TextInput style={styles.input} value={price} onChangeText={(text) => setPrice(text)} keyboardType="numeric" placeholder="Harga" /> 
 <TextInput style={styles.input} value={stock} onChangeText={(text) => setStock(text)} keyboardType="numeric" placeholder="Stok" /> 
 <TouchableOpacity style={styles.btn} onPress={handleUpdate}> <Text style={styles.btnText}>Simpan Perubahan</Text> 
 </TouchableOpacity> </View> 
 ); } 
 const styles = StyleSheet.create({ 
 container: { flex: 1, padding: 20 }, 
 input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 15, }, 
 btn: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 8, alignItems: 'center', }, 
 btnText: { color: '#fff', fontWeight: 'bold' }, });