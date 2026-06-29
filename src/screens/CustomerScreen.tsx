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
import Customer from '../database/models/Customer';

export default function CustomerScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sub = database
      .get<Customer>('customers')
      .query()
      .observe()
      .subscribe({
        next: data => { setCustomers(data); setLoading(false); },
        error: () => setLoading(false),
      });
    return () => sub.unsubscribe();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const openAdd = () => {
    setEditingCustomer(null);
    setName(''); setPhone(''); setEmail(''); setAddress('');
    setModalVisible(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name); setPhone(c.phone); setEmail(c.email); setAddress(c.address);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Gagal', 'Nama dan Telepon wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        if (editingCustomer) {
          await editingCustomer.update((c: any) => {
            c.name = name.trim();
            c.phone = phone.trim();
            c.email = email.trim();
            c.address = address.trim();
            c.updatedAt = new Date();
            c.isSynced = false;
          });
        } else {
          await database.get<Customer>('customers').create((c: any) => {
            c.name = name.trim();
            c.phone = phone.trim();
            c.email = email.trim();
            c.address = address.trim();
            c.isActive = true;
            c.deviceId = 'local';
            c.updatedAt = new Date();
            c.isSynced = false;
          });
        }
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan data pelanggan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c: Customer) => {
    Alert.alert('Hapus Pelanggan', `Hapus "${c.name}"?`, [
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

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.phone, { color: theme.textSecondary }]}>{item.phone}</Text>
        {item.email ? <Text style={[styles.email, { color: theme.textSecondary }]}>{item.email}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.primaryLight }]} onPress={() => openEdit(item)}>
          <Text style={[styles.editText, { color: theme.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.delBtn, { backgroundColor: theme.dangerLight }]} onPress={() => handleDelete(item)}>
          <Text style={[styles.delText, { color: theme.danger }]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Pelanggan 👥</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Total: {customers.length}</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={openAdd}>
          <Text style={[styles.addBtnText, { color: '#fff' }]}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
        <TextInput
          style={[styles.search, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          placeholder="Cari nama / telepon..."
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
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>Belum ada pelanggan terdaftar.</Text>}
          renderItem={renderItem}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Nama *" placeholderTextColor={theme.textSecondary} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Telepon *" placeholderTextColor={theme.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.textSecondary} value={email} onChangeText={setEmail} />
            <TextInput style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]} placeholder="Alamat" placeholderTextColor={theme.textSecondary} value={address} onChangeText={setAddress} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.borderLight }]} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveText, { color: '#fff' }]}>Simpan</Text>}
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
  addBtnText: { fontWeight: '700', fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  search: { borderRadius: 10, paddingHorizontal: 14, height: 42, fontSize: 15, borderWidth: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row', padding: 16, borderRadius: 14,
    marginBottom: 12, alignItems: 'center', borderWidth: 1,
  },
  name: { fontSize: 16, fontWeight: '700' },
  phone: { fontSize: 13, marginTop: 2 },
  email: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editText: { fontWeight: '600', fontSize: 13 },
  delBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  delText: { fontWeight: '600', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { fontWeight: '700', fontSize: 15 },
});
