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
import { useTheme } from '../theme/ThemeContext';
import Category from '../database/models/Category';
import EditIcon from '../assets/icons/Edit.svg';
import TrashIcon from '../assets/icons/Trash.svg';

export default function CategoryScreen({ navigation }: any) {
  const { theme } = useTheme();
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
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        {item.description ? <Text style={[styles.desc, { color: theme.textSecondary }]}>{item.description}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.primaryLight }]} onPress={() => openEdit(item)}>
          <EditIcon width={18} height={18} fill={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.dangerLight }]} onPress={() => handleDelete(item)}>
          <TrashIcon width={16} height={16} fill={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Kategori Produk 🗂️</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Total: {categories.length}</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

<View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
         <TextInput
           style={[styles.search, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
           placeholder="Cari kategori..."
           placeholderTextColor={theme.textSecondary}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>Belum ada kategori.</Text>}
          renderItem={renderItem}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</Text>
<TextInput
               style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
               placeholder="Nama Kategori *"
               placeholderTextColor={theme.textSecondary}
               value={name}
               onChangeText={setName}
             />
             <TextInput
               style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
               placeholder="Deskripsi (opsional)"
               placeholderTextColor={theme.textSecondary}
               value={description}
               onChangeText={setDescription}
             />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.borderLight }]} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={saving}>
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
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  search: { borderRadius: 10, paddingHorizontal: 14, height: 42, fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row', padding: 16, borderRadius: 14,
    marginBottom: 12, alignItems: 'center', borderWidth: 1,
  },
  name: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, borderRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
