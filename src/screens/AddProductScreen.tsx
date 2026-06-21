
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { addProduct, } from '../services/productService';// Menggunakan service yang tadi kita buat

export default function AddProductScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Gagal', 'Nama dan Harga harus diisi!');
      return;
    }
    
    try {
      await addProduct(name, Number(stock), Number(price));
      Alert.alert('Sukses', 'Produk berhasil ditambahkan');
      navigation.goBack(); // Kembali ke daftar produk
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan produk');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Nama Produk" 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
      />
      <TextInput 
        placeholder="Harga" 
        style={styles.input} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setPrice} 
      />
       <TextInput 
        placeholder="Stock" 
        style={styles.input} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setStock} 
      />
      <Button title="Simpan Produk" onPress={handleSave} color="#10B981" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 8,
    backgroundColor: '#fff' 
  }

import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { addProduct, } from '../services/productService';// Menggunakan service yang tadi kita buat

export default function AddProductScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert('Gagal', 'Nama dan Harga harus diisi!');
      return;
    }
    
    try {
      await addProduct(name, Number(stock), Number(price));
      Alert.alert('Sukses', 'Produk berhasil ditambahkan');
      navigation.goBack(); // Kembali ke daftar produk
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan produk');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Nama Produk" 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
      />
      <TextInput 
        placeholder="Harga" 
        style={styles.input} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setPrice} 
      />
       <TextInput 
        placeholder="Stock" 
        style={styles.input} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setStock} 
      />
      <Button title="Simpan Produk" onPress={handleSave} color="#10B981" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 8,
    backgroundColor: '#fff' 
  }

});