import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { createUser } from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';

export default function RegisterScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir');
  const [adminToken, setAdminToken] = useState('');
  const [activeToken, setActiveToken] = useState('DESWITA_INTAN_72');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('kasir');

  useEffect(() => {
    AsyncStorage.getItem('adminTokenSecret').then(t => { if (t) setActiveToken(t); });
    AsyncStorage.getItem('user_role').then(r => { if (r) setCurrentUserRole(r); });
  }, []);

  const handleRegister = async () => {
    if (currentUserRole === 'admin') {
      Alert.alert('Akses Ditolak ⚠️', 'Admin tidak dapat mengakses halaman ini.');
      return;
    }
    if (!name.trim() || !email.trim() || !pin || !confirmPin) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi!');
      return;
    }

    // 2. Validasi Format Email Sederhana
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Gagal', 'Format email tidak valid!');
      return;
    }

    // 3. Validasi Panjang PIN
    if (pin.length !== 6) {
      Alert.alert('Gagal', 'PIN harus terdiri dari 6 angka!');
      return;
    }

    // 4. Validasi Konfirmasi PIN
    if (pin !== confirmPin) {
      Alert.alert('Gagal', 'Konfirmasi PIN tidak cocok!');
      return;
    }

    // 5. Validasi Token Rahasia Khusus Admin
    if (role === 'admin' && adminToken.trim() !== activeToken) {
      Alert.alert(
        'Akses Ditolak ❌',
        'Kode Rahasia Admin salah! Anda tidak diizinkan membuat akun administrator.',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Eksekusi penyimpanan data ke WatermelonDB via userService
      await createUser(name.trim(), email.toLowerCase().trim(), pin, role);

      // PERBAIKAN: Hapus navigation.navigate('Login') dari tombol OK
      Alert.alert(
        'Berhasil 🎉',
        `Akun [${role.toUpperCase()}] berhasil didaftarkan!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Cukup kembalikan layar admin ke halaman Dashboard sebelumnya
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* CUSTOM HEADER */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Tambah Karyawan 👤</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Buat akun untuk staf toko
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Visual */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Daftar Akun Baru</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Buat akun untuk mulai mengelola akses sistem kasir toko Anda.
          </Text>
        </View>

        {/* Form Input */}
        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          {/* Input Nama */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Nama Lengkap</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />

          {/* Input Email */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Alamat Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="contoh@toko.com"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Selektor Pilihan Role */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Tingkatan Hak Akses (Role)</Text>
          <View style={styles.roleSelectorRow}>
            <TouchableOpacity
              style={[
                styles.roleOptionCard,
                role === 'kasir' && styles.roleOptionCardActive,
              ]}
              onPress={() => setRole('kasir')}
            >
              <Text
                style={[
                  styles.roleOptionTitle,
                  role === 'kasir' && styles.textActive,
                ]}
              >
                🛒 Kasir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOptionCard,
                role === 'admin' && styles.roleOptionCardActive,
              ]}
              onPress={() => setRole('admin')}
            >
              <Text
                style={[
                  styles.roleOptionTitle,
                  role === 'admin' && styles.textActive,
                ]}
              >
                🛠️ Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Kode Rahasia Admin */}
          {role === 'admin' && (
            <View>
              <Text style={[styles.label, { color: theme.danger }]}>
                Kode Rahasia Admin 店
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: theme.dangerLight, backgroundColor: theme.dangerLight },
                ]}
                placeholder="Masukkan token otentikasi pemilik"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={adminToken}
                onChangeText={setAdminToken}
              />
            </View>
          )}

          {/* Input PIN */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>PIN Keamanan (6 Angka)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="******"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            value={pin}
            onChangeText={setPin}
          />

          {/* Input Konfirmasi PIN */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Konfirmasi PIN</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="******"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            value={confirmPin}
            onChangeText={setConfirmPin}
          />

          {/* Tombol Register */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Daftar Sekarang</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { fontSize: 22, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  roleOptionCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  roleOptionCardActive: {
    borderColor: '#3B82F6',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  textActive: {
    color: '#3B82F6',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
