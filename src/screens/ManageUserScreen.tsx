
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { database } from '../database';
import User from '../database/models/User';
import { createUser, updateUser, deleteUser } from '../services/userService';

export default function ManageUserScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Mengamati data user secara real-time dari database
  useEffect(() => {
    const subscription = database
      .get<User>('users')
      .query()
      .observe()
      .subscribe(data => setUsers(data));

    return () => subscription.unsubscribe();
  }, []);

  // Handler Kirim Data (Tambah / Edit)
  const handleSubmit = async () => {
    // 1. Validasi Kolom Kosong
    if (!name.trim() || !email.trim() || !pin.trim()) {
      Alert.alert('Gagal', 'Semua kolom input wajib diisi!');
      return;
    }

    // 2. Validasi Format Email (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Gagal', 'Format alamat email tidak valid!');
      return;
    }

    // 3. Validasi Format dan Panjang PIN (Harus 6 Digit Angka)
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(pin)) {
      Alert.alert('Gagal', 'PIN transaksi harus berupa 6 digit angka!');
      return;
    }

    try {
      if (editingUser) {
        // Mode Edit Data
        await updateUser(editingUser, {
          name: name.trim(),
          email: email.trim().toLowerCase(), // Otomatis simpan dalam huruf kecil
          pin,
        });
        Alert.alert('Sukses', 'Data pengguna berhasil diperbarui!');
        setEditingUser(null);
      } else {
        // Mode Tambah Baru
        await createUser(name.trim(), email.trim().toLowerCase(), pin);
        Alert.alert('Sukses', 'Pengguna baru berhasil ditambahkan!');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Eror', 'Terjadi kesalahan saat menyimpan data.');
    }
  };
  // Set form untuk mengedit
  const handleEditInit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPin(user.pin);
  };

  // Handler Hapus Data
  const handleDelete = (user: User) => {
    Alert.alert('Konfirmasi', `Hapus pengguna ${user.name}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteUser(user);
        },
      },
    ]);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPin('');
    setEditingUser(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      </Text>

      {/* FORM INPUT */}
      <TextInput
        style={styles.input}
        placeholder="Nama Lengkap"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="PIN Transaksi (6 digit)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editingUser ? 'Perbarui' : 'Simpan'}
          </Text>
        </TouchableOpacity>
        {editingUser && (
          <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.buttonText}>Batal</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DAFTAR USER */}
      <Text style={styles.subTitle}>Daftar Pengguna Aktif</Text>
      <ScrollView>
        {users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditInit(user)}
              >
                <Text style={styles.actionText}>Ubah</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(user)}
              >
                <Text style={styles.actionText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1E293B',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    color: '#1E293B',
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#64748B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  userEmail: { fontSize: 14, color: '#64748B' },
  actionGroup: { flexDirection: 'row', gap: 8 },
  editButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
