
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { database } from '../database';

export default function EditProductScreen({ route, navigation }: any) {
  const { product } = route.params; // Mengambil data dari navigasi
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));

const handleUpdate = async () => {
  if (isNaN(parseFloat(price)) || isNaN(parseInt(stock))) {
    Alert.alert('Error', 'Harga dan Stok harus berupa angka yang valid');
    return;
  }
  try {
    await database.write(async () => {
      await product.update((p: any) => {
        p.name = name;
        p.price = parseFloat(price);
        p.stock = parseInt(stock);
      });
    });
    Alert.alert('Sukses', 'Produk berhasil diperbarui');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan data.');
  }
};
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama Produk" />
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Harga" />
      <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="Stok" />
      <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
        <Text style={styles.btnText}>Simpan Perubahan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 15 },
  btn: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }

});