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
import TrashIcon from '../assets/icons/Trash.svg'; // BENAR
import EditIcon from '../assets/icons/Edit.svg'; 

export default function ProductScreen({ navigation }: any) {
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
                {/* Indikator Stok Menipis */}
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

              {/* Kontainer Tombol Aksi di Sebelah Kanan */}
              <View style={styles.actionContainer}>
                {/* Tombol Aksi Edit */}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate('EditProduct', { product: item })
                  }
                >
                  <EditIcon width={24} height={24} fill="#3B82F6" />
                </TouchableOpacity>

                {/* Tombol Aksi Hapus */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(item)}
                >
                  <TrashIcon width={24} height={24} fill="#FF0000" />
                </TouchableOpacity>
              </View>
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
                  <ActivityIndicator size="small" color="#fff" />
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: '#1E293B', fontSize: 14 },
  clearButtonText: { fontSize: 16, color: '#94A3B8', paddingHorizontal: 5 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { color: '#64748B', fontSize: 16, textAlign: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  productPrice: {
    fontSize: 14,
    color: '#3B82F6',
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
  editButton: { padding: 8, marginRight: 4 },
  deleteButton: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  btnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
  },
  btnCancelText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  btnSubmit: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
