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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import { useTheme } from '../theme/ThemeContext';
import Category from '../database/models/Category';

export default function EditProductScreen({ route, navigation }: any) {
  const { theme, themeMode } = useTheme();
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isActive = selectedCategoryId === item.id;
    return (
    <TouchableOpacity
      style={[styles.categoryItem, { borderBottomColor: theme.border, backgroundColor: isActive ? theme.primaryLight : 'transparent' }]}
      onPress={() => { setSelectedCategoryId(item.id); setShowCategoryModal(false); }}
    >
      <Text style={[styles.categoryName, { color: isActive ? theme.primary : theme.text }]}>
        {item.name}
      </Text>
      {isActive && <Text style={{ color: theme.primary, fontWeight: '700' }}>✓</Text>}
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Produk</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Nama Produk</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} value={name} onChangeText={setName} />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Harga Jual (Rp)</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} value={price} onChangeText={setPrice} keyboardType="numeric" />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Harga Beli / Modal (Rp)</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Stok Saat Ini</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} value={stock} onChangeText={setStock} keyboardType="numeric" />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Kategori</Text>
          <TouchableOpacity style={[styles.selectBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} onPress={() => setShowCategoryModal(true)}>
            <Text style={[styles.selectLabel, { color: theme.text }]}>
              {selectedCategory ? selectedCategory.name : 'Pilih Kategori (Opsional)'}
            </Text>
            <Text style={[styles.selectArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { fontSize: 24, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { flex: 1, padding: 16, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, borderWidth: 1,
  },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  selectLabel: { fontSize: 15, fontWeight: '500' },
  selectArrow: { fontSize: 22 },
  saveBtn: {
    marginTop: 24, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  categoryItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
  },
  categoryName: { fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: 12 },
  closeBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeText: { fontWeight: '700', fontSize: 15 },
});
