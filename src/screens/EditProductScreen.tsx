import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import Category from '../database/models/Category';

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const product = await database.get('products').find(productId) as any;
        setName(product.name);
        setPrice(Number(product.price).toString());
        setCostPrice(Number(product.costPrice || 0).toString());
        setStock(Number(product.stock).toString());
        setSelectedCategoryId(product.categoryId || null);
      } catch (e) {
        Alert.alert('Error', 'Gagal memuat data produk.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();

    const sub = database.get<Category>('categories').query().observe().subscribe({
      next: data => setCategories(data),
    });
    return () => sub.unsubscribe();
  }, [productId]);

  const handleSave = async () => {
    if (!name.trim() || !price || !costPrice || !stock) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        const product = await database.get('products').find(productId as any);
        await product.update((p: any) => {
          p.name = name.trim();
          p.price = Number(price);
          p.costPrice = Number(costPrice);
          p.stock = Number(stock);
          p.categoryId = selectedCategoryId || '';
          p.updatedAt = Date.now();
          p.isSynced = false;
        });
      });
      Alert.alert('Sukses', 'Produk berhasil diperbarui.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
    );
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.form}>
          <Text style={styles.label}>Nama Produk</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Harga Jual (Rp)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

          <Text style={styles.label}>Harga Beli / Modal (Rp)</Text>
          <TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />

          <Text style={styles.label}>Stok Saat Ini</Text>
          <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" />

          <Text style={styles.label}>Kategori</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCategoryModal(true)}>
            <Text style={styles.selectLabel}>
              {selectedCategory ? selectedCategory.name : 'Pilih Kategori (Opsional)'}
            </Text>
            <Text style={styles.selectArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0',
  },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  selectLabel: { fontSize: 15, color: '#334155', fontWeight: '500' },
  selectArrow: { fontSize: 22, color: '#94A3B8' },
  saveBtn: {
    marginTop: 24, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
