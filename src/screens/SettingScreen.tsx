
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
import { updateUser, deleteUser } from '../services/userService';
import User from '../database/models/User';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingScreen() {
  // 💡 Semua state diletakkan aman di dalam komponen utama
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('kasir');
  const [newAdminToken, setNewAdminToken] = useState('');
  const [activeToken, setActiveToken] = useState('TOKO_SUKSES_123');

  // State Kontroler Modal UI
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inisialisasi data hak akses dan sinkronisasi real-time database
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        setCurrentUserRole(role ?? 'kasir');

        const token = await AsyncStorage.getItem('adminTokenSecret');
        if (token) setActiveToken(token);
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
    if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
      Alert.alert(
        'Akses Ditolak ⚠️',
        'Hanya akun administrator/pemilik yang boleh mengubah data kasir.',
      );
      return;
    }
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPin('');
    setIsModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
      Alert.alert(
        'Akses Ditolak ⚠️',
        'Anda tidak memiliki hak akses memodifikasi data.',
      );
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
      Alert.alert('Sukses 🎉', 'Data kasir berhasil diperbarui!');
      setIsModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error ❌', 'Gagal memperbarui data user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'superuser') {
      Alert.alert(
        'Tindakan Ilegal ❌',
        'Akun SuperUser utama sistem tidak dapat dihapus oleh siapa pun!',
      );
      return;
    }
    if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
      Alert.alert(
        'Akses Ditolak ⚠️',
        'Anda tidak memiliki otoritas menghapus data.',
      );
      return;
    }

    Alert.alert(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus kasir "${user.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user);
              Alert.alert('Sukses 🎉', 'Akun kasir berhasil dihapus.');
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
        'Sukses 🎉',
        'Kode rahasia pendaftaran Admin berhasil diperbarui!',
      );
      setNewAdminToken('');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan kode rahasia baru.');
    }
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manajemen User 👥</Text>
        <Text style={styles.headerSubtitle}>
          Kelola hak akses dan akun kasir toko Anda
        </Text>
      </View>

      {/* DAFTAR USER */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Belum ada user terdaftar 📋</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
              </View>

              {/* 4. PROTEKSI UI: Sembunyikan tombol jika bukan Admin / SuperUser */}
              {(currentUserRole === 'admin' ||
                currentUserRole === 'superuser') && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Jika bukan pemilik toko, beri info penanda akses terkunci */}
              {currentUserRole !== 'admin' &&
                currentUserRole !== 'superuser' && (
                  <View style={styles.cardActions}>
                    <Text
                      style={{
                        color: '#94A3B8',
                        fontSize: 12,
                        fontStyle: 'italic',
                      }}
                    >
                      🔒 Terkunci
                    </Text>
                  </View>
                )}
            </View>
          )}
        />
      )}

      {/* MODAL BOTTOM FORM EDIT USER */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Profil Kasir 📝</Text>

            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Alamat Email</Text>
            <TextInput
              style={styles.input}
              placeholder="contoh@toko.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>
              PIN Baru (Kosongkan jika tidak diubah)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={setPin}
            />

            {/* Tombol Aksi Modal */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedUser(null);
                }}
                disabled={isSaving}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSubmit}
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

      {/* 💡 PANEL KHUSUS SUPERUSER & ADMIN UNTUK MENGUBAH KODE RAHASIA */}
      {(currentUserRole === 'superuser' || currentUserRole === 'admin') && (
        <View style={styles.superUserPanel}>
          <Text style={styles.panelTitle}>
            Pengaturan Pemilik (SuperUser) 🔒
          </Text>
          <Text style={styles.panelSubtitle}>
            Kode aktif saat ini:{' '}
            <Text style={{ fontWeight: '800' }}>{activeToken}</Text>
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.panelInput}
              placeholder="Masukkan kode rahasia baru"
              placeholderTextColor="#94A3B8"
              value={newAdminToken}
              onChangeText={setNewAdminToken}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.btnSaveToken}
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  listContainer: { padding: 16, paddingBottom: 20 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '500' },

  userCard: {
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
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: { color: '#2563EB', fontWeight: '700', fontSize: 16 },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  userEmail: { fontSize: 13, color: '#64748B' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editButtonText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteButtonText: { fontSize: 14 },

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
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancelText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  btnSubmit: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSubmitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // PANEL DINAMIS KODE RAHASIA
  superUserPanel: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  panelInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnSaveToken: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSaveTokenText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

