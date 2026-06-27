
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { addProduct, getCategories } from '../services/productService';
import { database } from '../database';
import { useTheme } from '../theme/ThemeContext';
import Category from '../database/models/Category';

export default function AddProductScreen({ navigation }: any) {
  const { theme } = useTheme();
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
      {selectedCategoryId === item.id && <Text style={{ color: theme.primary, fontWeight: '700' }}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput 
        placeholder="Nama Produk" 
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
        value={name} 
        onChangeText={setName} 
        placeholderTextColor={theme.textSecondary}
      />
      <TextInput 
        placeholder="Harga Jual" 
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
        keyboardType="numeric" 
        value={price} 
        onChangeText={setPrice}
        placeholderTextColor={theme.textSecondary}
      />
      <TextInput 
        placeholder="Harga Beli (Modal)" 
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
        keyboardType="numeric" 
        value={costPrice} 
        onChangeText={setCostPrice}
        placeholderTextColor={theme.textSecondary}
      />
       <TextInput 
         placeholder="Stok" 
         style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} 
         keyboardType="numeric" 
         value={stock} 
         onChangeText={setStock}
         placeholderTextColor={theme.textSecondary}
       />

       <TouchableOpacity style={[styles.selectBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} onPress={() => setShowCategoryModal(true)}>
         <Text style={[styles.selectLabel, { color: theme.text }]}>
           {selectedCategory ? selectedCategory.name : 'Pilih Kategori (Opsional)'}
         </Text>
         <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>›</Text>
       </TouchableOpacity>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Simpan Produk</Text>
      </TouchableOpacity>

      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pilih Kategori</Text>
            <FlatList
              data={categories}
              keyExtractor={i => i.id}
              renderItem={renderCategoryItem}
              ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>Belum ada kategori.</Text>}
            />
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.borderLight }]} onPress={() => setShowCategoryModal(false)}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>Tutup</Text>
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
    padding: 12, 
    marginBottom: 15, 
    borderRadius: 8,
  },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  selectLabel: { fontSize: 15, fontWeight: '500' },
  selectArrow: { fontSize: 22 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  categoryItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
  },
  categoryItemActive: { backgroundColor: '#EFF6FF' },
  categoryName: { fontSize: 15, fontWeight: '600' },
  categoryNameActive: { color: '#2563EB' },
  empty: { textAlign: 'center', paddingVertical: 12 },
  closeBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeText: { fontWeight: '700', fontSize: 15 },
});
