import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import { useTheme } from '../theme/ThemeContext';
import TrashIcon from '../assets/icons/Trash.svg';
import EditIcon from '../assets/icons/Edit.svg';
import { DarkTheme, LightTheme } from '../theme/colors';

export default function ProductScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Modal Tambah Produk
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ambil data produk secara real-time dari WatermelonDB
  useEffect(() => {
    const productsCollection = database.get('products');
    const subscription = productsCollection
      .query()
      .observe()
      .subscribe({
        next: data => {
          setProducts(data);
          setLoading(false);
        },
        error: err => {
          console.error('Gagal memuat produk:', err);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let sub: any;
      try {
        sub = database.get('products').query().observe().subscribe({
          next: (data) => setProducts(data),
          error: () => {},
        });
      } catch (e) {
        // ignore
      }
      return () => {
        if (sub) sub.unsubscribe();
      };
    }, []),
  );

  // Filter pencarian produk
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Fungsi Menambah Produk Baru
  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !stock.trim() || !costPrice.trim()) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const productsCollection = database.get('products');

      await database.write(async () => {
        await productsCollection.create((newProduct: any) => {
          newProduct.name = name.trim();
          newProduct.price = Number(price);
          newProduct.costPrice = Number(costPrice);
          newProduct.stock = Number(stock);
          newProduct.isActive = true;
          newProduct.deviceId = 'local';
          newProduct.updatedAt = new Date();
          newProduct.isSynced = false;
        });
      });

      Alert.alert('Sukses', 'Produk baru berhasil ditambahkan!');
      setName('');
      setPrice('');
      setCostPrice('');
      setStock('');
      setIsModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan produk ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi Menghapus Produk
  const handleDeleteProduct = (product: any) => {
    Alert.alert(
      'Hapus Produk',
      `Apakah Anda yakin ingin menghapus "${product.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                // Menggunakan mekanisme soft delete WatermelonDB untuk sinkronisasi
                await product.markAsDeleted();
              });
              Alert.alert('Sukses', 'Produk berhasil dihapus.');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus produk.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Manajemen Produk 📦</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Kelola stok dan harga barang dagangan
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Cari nama produk..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* DAFTAR BARANG */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Belum ada produk terdaftar 📋
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>
                  Rp {Number(item.price).toLocaleString('id-ID')}
                </Text>
                <View
                  style={[
                    styles.stockBadge,
                    item.stock <= 5 ? styles.stockLow : styles.stockNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.stockText,
                      item.stock <= 5 ? styles.stockTextLow : styles.stockTextNormal,
                    ]}
                  >
                    Stok: {item.stock} unit
                  </Text>
                </View>
              </View>

              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProduct', { productId: item.id })}>
                  <EditIcon width={24} height={24} fill={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item)}>
                  <TrashIcon width={24} height={24} fill={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Tambah Produk Baru 📥</Text>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama Produk</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Contoh: Kopi Susu Gula Aren" placeholderTextColor={theme.textSecondary} value={name} onChangeText={setName} />
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Harga Jual (Rp)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Contoh: 15000" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={price} onChangeText={setPrice} />
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Harga Beli / Modal (Rp)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Contoh: 12000" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={costPrice} onChangeText={setCostPrice} />
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Jumlah Stok Awal</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Contoh: 50" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={stock} onChangeText={setStock} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btnCancel, { backgroundColor: theme.borderLight }]} onPress={() => setIsModalVisible(false)} disabled={isSaving}>
                <Text style={[styles.btnCancelText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSubmit, { backgroundColor: theme.primary }]} onPress={handleAddProduct} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnSubmitText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  clearButtonText: { fontSize: 16, paddingHorizontal: 5 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { fontSize: 16, textAlign: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  productCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  stockNormal: { backgroundColor: '#DCFCE7' },
  stockLow: { backgroundColor: '#FEE2E2' },
  stockText: { fontSize: 12, fontWeight: '600' },
  stockTextNormal: { color: '#15803D' },
  stockTextLow: { color: '#B91C1C' },
  actionContainer: { flexDirection: 'row', alignItems: 'center' },
  editButton: { padding: 8, marginRight: 4, },
  deleteButton: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  btnCancelText: { fontWeight: 'bold', fontSize: 16 },
  btnSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
