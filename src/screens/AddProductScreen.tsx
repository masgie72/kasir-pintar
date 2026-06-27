
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { addProduct, getCategories } from '../services/productService';
import { database } from '../database';
import Category from '../database/models/Category';

export default function AddProductScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const sub = database.get<Category>('categories').query().observe().subscribe({
      next: data => setCategories(data),
    });
    return () => sub.unsubscribe();
  }, []);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleSave = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Gagal', 'Nama, Harga, dan Stok harus diisi!');
      return;
    }

    try {
      await addProduct(name, Number(price), Number(costPrice || 0), Number(stock), selectedCategoryId ?? undefined);
      Alert.alert('Sukses', 'Produk berhasil ditambahkan');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan produk');
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategoryId === item.id && styles.categoryItemActive]}
      onPress={() => { setSelectedCategoryId(item.id); setShowCategoryModal(false); }}
    >
      <Text style={[styles.categoryName, selectedCategoryId === item.id && styles.categoryNameActive]}>
        {item.name}
      </Text>
      {selectedCategoryId === item.id && <Text style={{ color: '#3B82F6', fontWeight: '700' }}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput 
        placeholder="Nama Produk" 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
      />
      <TextInput 
        placeholder="Harga Jual" 
        style={styles.input} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setPrice} 
      />
      <TextInput 
        placeholder="Harga Beli (Modal)" 
        style={styles.input} 
        keyboardType="numeric" 
        value={costPrice} 
        onChangeText={setCostPrice} 
      />
       <TextInput 
         placeholder="Stok" 
         style={styles.input} 
         keyboardType="numeric" 
         value={stock} 
         onChangeText={setStock} 
       />

      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
        <Text style={styles.selectLabel}>
          {selectedCategory ? selectedCategory.name : 'Pilih Kategori (Opsional)'}
        </Text>
        <Text style={styles.selectArrow}>›</Text>
      </TouchableOpacity>

      <Button title="Simpan Produk" onPress={handleSave} color="#10B981" />

      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Kategori</Text>
            <FlatList
              data={categories}
              keyExtractor={i => i.id}
              renderItem={renderCategoryItem}
              ListEmptyComponent={<Text style={styles.empty}>Belum ada kategori.</Text>}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.closeText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16,
  },
  selectLabel: { fontSize: 15, color: '#334155', fontWeight: '500' },
  selectArrow: { fontSize: 22, color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  categoryItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderColor: '#F1F5F9',
  },
  categoryItemActive: { backgroundColor: '#EFF6FF' },
  categoryName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  categoryNameActive: { color: '#2563EB' },
  empty: { textAlign: 'center', color: '#94A3B8', paddingVertical: 12 },
  closeBtn: { marginTop: 12, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeText: { color: '#475569', fontWeight: '700', fontSize: 15 },
});
