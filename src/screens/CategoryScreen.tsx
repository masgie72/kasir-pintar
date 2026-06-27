import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import Category from '../database/models/Category';

export default function CategoryScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sub = database.get<Category>('categories').query().observe().subscribe({
      next: data => { setCategories(data); setLoading(false); },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setName(''); setDescription('');
    setModalVisible(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name); setDescription(c.description);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Gagal', 'Nama kategori wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        if (editingCategory) {
          await editingCategory.update((c: any) => {
            c.name = name.trim();
            c.description = description.trim();
            c.updatedAt = new Date();
            c.isSynced = false;
          });
        } else {
          await database.get<Category>('categories').create((c: any) => {
            c.name = name.trim();
            c.description = description.trim();
            c.deviceId = 'local';
            c.updatedAt = new Date();
            c.isSynced = false;
          });
        }
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c: Category) => {
    Alert.alert('Hapus Kategori', `Hapus "${c.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await database.write(async () => { await c.markAsDeleted(); });
          } catch { Alert.alert('Error', 'Gagal menghapus.'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.delText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Kategori Produk 🗂️</Text>
          <Text style={styles.headerSub}>Total: {categories.length}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Cari kategori..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          ListEmptyComponent={<Text style={styles.empty}>Belum ada kategori.</Text>}
          renderItem={renderItem}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</Text>
            <TextInput style={styles.input} placeholder="Nama Kategori *" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Deskripsi (opsional)" value={description} onChangeText={setDescription} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Simpan</Text>}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  search: { backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, height: 42, fontSize: 15, color: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 14,
    marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  desc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  delBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  delText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
