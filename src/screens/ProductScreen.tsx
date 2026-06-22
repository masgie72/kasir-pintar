import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import TrashIcon from './src/assets/icons/Trash.svg'; // Sesuaikan relative path (../) dengan lokasi file ini

export default function ProductScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Modal Tambah Produk
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
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

  // Filter pencarian produk
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Fungsi Menambah Produk Baru
  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !stock.trim()) {
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
          newProduct.stock = Number(stock);
        });
      });

      Alert.alert('Sukses', 'Produk baru berhasil ditambahkan!');
      // Reset Form & Tutup Modal
      setName('');
      setPrice('');
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
                // Jika ingin siap disinkronisasikan ke backend API nanti:
                await product.markAsDeleted();
                // Jika ingin hapus permanen lokal langsung tanpa sync:
                // await product.destroyPermanently();
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* HEADER & TOMBOL TAMBAH */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kelola Stok 📦</Text>
          <Text style={styles.headerSubtitle}>
            Total: {products.length} Jenis Produk
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Produk</Text>
        </TouchableOpacity>
      </View>

      {/* BAR PENCARIAN */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk di gudang..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DAFTAR BARANG */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                Belum ada produk terdaftar 📋
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>
                  Rp {Number(item.price).toLocaleString('id-ID')}
                </Text>
                {/* Indikator Stok Menipis (Modern UX) */}
                <View
                  style={[
                    styles.stockBadge,
                    item.stock <= 5 ? styles.stockLow : styles.stockNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.stockText,
                      item.stock <= 5
                        ? styles.stockTextLow
                        : styles.stockTextNormal,
                    ]}
                  >
                    Stok: {item.stock} unit
                  </Text>
                </View>
              </View>

              {/* Tombol Aksi Hapus */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteProduct(item)}
              >
                <TrashIcon width={24} height={24} fill="#FF0000" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* MODAL / POP-UP TAMBAH PRODUK BARU */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Produk Baru 📥</Text>

            <Text style={styles.inputLabel}>Nama Produk</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kopi Susu Gula Aren"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Harga Jual (Rp)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 15000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.inputLabel}>Jumlah Stok Awal</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 50"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />

            {/* Baris Tombol Aksi Modal */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setIsModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={handleAddProduct}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnSubmitText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  searchIcon: { marginRight: 8, fontSize: 15 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 15, padding: 0 },
  clearButtonText: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold' },

  listContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '500' },

  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  productInfo: { flex: 1, alignItems: 'flex-start' },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
    marginBottom: 6,
  },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockNormal: { backgroundColor: '#F0FDF4' },
  stockLow: { backgroundColor: '#FEF2F2' },
  stockText: { fontSize: 12, fontWeight: '600' },
  stockTextNormal: { color: '#166534' },
  stockTextLow: { color: '#991B1B' },
  deleteButton: {
    padding: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: { fontSize: 16 },
  // STYLING MODAL FORM
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  btnSubmit: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
