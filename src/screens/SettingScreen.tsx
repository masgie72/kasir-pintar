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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../database';
import { updateUser, deleteUser } from '../services/userService';
import { useTheme } from '../theme/ThemeContext';
import User from '../database/models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrUpdateStore, getStore, getStoreData, StoreData } from '../services/storeService';

type Props = {
  navigation?: any;
  route?: any;
};

export default function SettingScreen({ navigation }: Props) {
  const { theme, themeMode, toggleTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('kasir');
  const [newAdminToken, setNewAdminToken] = useState('');
  const [activeToken, setActiveToken] = useState('TOKO_SUKSES_123');
  const [storeData, setStoreData] = useState<StoreData>({ name: '', address: '', phone: '' });
  const [isStoreSaving, setIsStoreSaving] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const role = await AsyncStorage.getItem('user_role');
        setCurrentUserRole(role ?? 'kasir');
        const token = await AsyncStorage.getItem('adminTokenSecret');
        if (token) setActiveToken(token);

        const store = await getStore();
        if (store) {
          setStoreData({ name: store.name, address: store.address, phone: store.phone });
        } else {
          const defaults = await getStoreData();
          setStoreData(defaults);
        }
      } catch (err) {
        console.error('Gagal memuat sesi setelan:', err);
      }
    };
    initializeSettings();

    const usersCollection = database.get<User>('users');
    const subscription = usersCollection
      .query()
      .observe()
      .subscribe({
        next: data => {
          setUsers(data);
          setLoading(false);
        },
        error: err => {
          console.error('Gagal memuat daftar kasir:', err);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  const handleOpenEdit = (user: User) => {
    if (currentUserRole === 'kasir') {
      Alert.alert('Akses Ditolak', 'Hanya Owner/Admin yang memiliki akses edit.');
      return;
    }
    if (currentUserRole === 'admin' && user.role === 'owner') {
      Alert.alert('Akses Ditolak', 'Admin tidak dapat mengubah data Owner/Superuser.');
      return;
    }
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPin('');
    setIsModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (currentUserRole === 'kasir') {
      Alert.alert('Akses Ditolak', 'Tindakan ilegal. Anda tidak memiliki hak akses.');
      return;
    }
    if (currentUserRole === 'admin' && selectedUser?.role === 'owner') {
      Alert.alert('Akses Ditolak', 'Admin tidak dapat mengubah data Owner/Superuser.');
      return;
    }
    if (!selectedUser) return;
    if (!name.trim() || !email.trim()) {
      Alert.alert('Gagal', 'Nama dan Email wajib diisi!');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData: { name: string; email: string; pin?: string } = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      };

      if (pin.trim().length > 0) {
        if (pin.trim().length !== 6) {
          Alert.alert('Gagal', 'PIN baru harus terdiri dari 6 angka!');
          setIsSaving(false);
          return;
        }
        updatedData.pin = pin.trim();
      }

      await updateUser(selectedUser, updatedData);
      Alert.alert('Sukses', 'Data user berhasil diperbarui!');
      setIsModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memperbarui data user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'owner') {
      Alert.alert('Tindakan Ilegal', 'Akun Owner utama tidak dapat dihapus oleh siapa pun!');
      return;
    }
    if (currentUserRole === 'kasir') {
      Alert.alert('Akses Ditolak', 'Hanya Owner/Admin yang boleh menghapus akun.');
      return;
    }
    Alert.alert(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user);
              Alert.alert('Sukses', 'Akun berhasil dihapus.');
              if (selectedUser?.id === user.id) {
                setIsModalVisible(false);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus akun.');
            }
          },
        },
      ],
    );
  };

  const handleSaveNewToken = async () => {
    if (!newAdminToken.trim()) {
      Alert.alert('Gagal', 'Kode rahasia baru tidak boleh kosong!');
      return;
    }
    try {
      await AsyncStorage.setItem('adminTokenSecret', newAdminToken.trim());
      setActiveToken(newAdminToken.trim());
      Alert.alert(
        'Sukses',
        'Kode rahasia pendaftaran Admin berhasil diperbarui!',
      );
      setNewAdminToken('');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan kode rahasia baru.');
    }
  };

  const handleSaveStore = async () => {
    if (!storeData.name.trim() || !storeData.address.trim() || !storeData.phone.trim()) {
      Alert.alert('Gagal', 'Nama toko, alamat, dan nomor HP wajib diisi!');
      return;
    }
    setIsStoreSaving(true);
    try {
      await createOrUpdateStore(storeData.name, storeData.address, storeData.phone);
      Alert.alert('Sukses', 'Data toko berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data toko.');
    } finally {
      setIsStoreSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Pengaturan Kasir</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Kelola tema, user, dan preferensi aplikasi
          </Text>
        </View>
      </View>

      <View style={[styles.themeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.themeTitle, { color: theme.text }]}>Tema Aplikasi</Text>
          <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
            {themeMode === 'dark' ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}
          </Text>
        </View>
        <Switch
          value={themeMode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: theme.textSecondary, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <TouchableOpacity
        style={[styles.storeSummaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setIsStoreModalVisible(true)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.storeSummaryTitle, { color: theme.text }]}>Pengaturan Toko</Text>
          <Text style={[styles.storeSummaryText, { color: theme.textSecondary }]} numberOfLines={1}>
            {storeData.name} · {storeData.phone}
          </Text>
        </View>
        <Text style={[styles.storeSummaryArrow, { color: theme.textSecondary }]}>›</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Belum ada user terdaftar</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.text }]}>
              <View style={styles.userInfo}>
                <View style={[styles.avatarMini, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.avatarMiniText, { color: theme.primary }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
                </View>
              </View>

              {(currentUserRole === 'owner' || (currentUserRole === 'admin' && item.role !== 'owner')) && (
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleOpenEdit(item)}>
                    <Text style={[styles.editButtonText, { color: theme.textSecondary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.dangerLight, borderColor: theme.border }]} onPress={() => handleDeleteUser(item)}>
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              )}

              {currentUserRole === 'kasir' && (
                <View style={styles.cardActions}>
                  <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
                    Akses Terkunci
                  </Text>
                </View>
              )}

              {currentUserRole === 'admin' && item.role === 'owner' && (
                <View style={styles.cardActions}>
                  <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
                    Terkunci (Owner)
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ubah Profil Kasir</Text>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama Lengkap</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Masukkan nama"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Alamat Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="contoh@toko.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              PIN Baru (Kosongkan jika tidak diubah)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="******"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={setPin}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnCancel, { backgroundColor: theme.surface }]}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedUser(null);
                }}
                disabled={isSaving}
              >
                <Text style={[styles.btnCancelText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: theme.primary }]}
                onPress={handleUpdateUser}
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

      <Modal visible={isStoreModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Pengaturan Toko</Text>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama Toko</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Nama Toko"
              placeholderTextColor={theme.textSecondary}
              value={storeData.name}
              onChangeText={text => setStoreData({ ...storeData, name: text })}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Alamat Toko</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Alamat lengkap toko"
              placeholderTextColor={theme.textSecondary}
              value={storeData.address}
              onChangeText={text => setStoreData({ ...storeData, address: text })}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nomor HP</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0812-xxxx-xxxx"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              value={storeData.phone}
              onChangeText={text => setStoreData({ ...storeData, phone: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btnCancel, { backgroundColor: theme.surface }]}
                onPress={() => setIsStoreModalVisible(false)}
                disabled={isStoreSaving}
              >
                <Text style={[styles.btnCancelText, { color: theme.textSecondary }]}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: theme.primary }]}
                onPress={handleSaveStore}
                disabled={isStoreSaving}
              >
                {isStoreSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnSubmitText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
        <View style={[styles.superUserPanel, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}>
          <Text style={[styles.panelTitle, { color: theme.warning }]}>Pengaturan Pemilik (Owner)</Text>
          <Text style={[styles.panelSubtitle, { color: theme.textSecondary }]}>
            Kode aktif saat ini: {' '}
            <Text style={{ fontWeight: '800', color: theme.text }}>{activeToken}</Text>
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.panelInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Masukkan kode rahasia baru"
              placeholderTextColor={theme.textSecondary}
              value={newAdminToken}
              onChangeText={setNewAdminToken}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.btnSaveToken, { backgroundColor: theme.warning }]}
              onPress={handleSaveNewToken}
            >
              <Text style={styles.btnSaveTokenText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { fontSize: 24, fontWeight: '700' },

  listContainer: { padding: 16, paddingBottom: 20 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, fontWeight: '500' },

  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: { fontWeight: '700', fontSize: 16 },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: { fontSize: 13 },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editButtonText: { fontWeight: '600', fontSize: 13 },
  deleteButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteButtonText: { fontSize: 14 },
  lockedText: { fontSize: 12, fontStyle: 'italic' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: { fontWeight: '700', fontSize: 15 },
  btnSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  superUserPanel: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  panelSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  panelInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  btnSaveToken: {
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSaveTokenText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  themeTitle: { fontSize: 15, fontWeight: '700' },
  themeSub: { fontSize: 12, marginTop: 2 },
  storeSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  storeSummaryTitle: { fontSize: 15, fontWeight: '700' },
  storeSummaryText: { fontSize: 12, marginTop: 2 },
  storeSummaryArrow: { fontSize: 24, fontWeight: '700' },
});