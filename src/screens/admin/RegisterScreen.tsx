import React, { useState } from 'react';
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
import { createUser } from '../../services/userService'; // Jalur import 2 tingkat dari folder admin

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir'); 
  const [adminToken, setAdminToken] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  // Kunci kode rahasia admin toko Anda
  const KUNCI_RAHASIA_ADMIN = "DESWITA_INTAN_72"; 

  const handleRegister = async () => {
    // 1. Validasi Input Kosong
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
    if (role === 'admin' && adminToken.trim() !== KUNCI_RAHASIA_ADMIN) {
      Alert.alert('Akses Ditolak ❌', 'Kode Rahasia Admin salah! Anda tidak diizinkan membuat akun administrator.');
      return;
    }

    setIsLoading(true);

    try {
      // 6. Eksekusi penyimpanan ke WatermelonDB via userService
      await createUser(name.trim(), email.toLowerCase().trim(), pin, role);
      
      Alert.alert('Berhasil 🎉', `Akun [${role.toUpperCase()}] berhasil didaftarkan!`, [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Visual */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Daftar Akun Baru</Text>
          <Text style={styles.subtitle}>Buat akun untuk mulai mengelola akses sistem kasir toko Anda.</Text>
        </View>

        {/* Form Input */}
        <View style={styles.formContainer}>
          
          {/* Input Nama */}
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          {/* Input Email */}
          <Text style={styles.label}>Alamat Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh@toko.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Selektor Pilihan Role */}
          <Text style={styles.label}>Tingkatan Hak Akses (Role)</Text>
          <View style={styles.roleSelectorRow}>
            <TouchableOpacity
              style={[styles.roleOptionCard, role === 'kasir' && styles.roleOptionCardActive]}
              onPress={() => setRole('kasir')}
            >
              <Text style={[styles.roleOptionTitle, role === 'kasir' && styles.textActive]}>🛒 Kasir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleOptionCard, role === 'admin' && styles.roleOptionCardActive]}
              onPress={() => setRole('admin')}
            >
              <Text style={[styles.roleOptionTitle, role === 'admin' && styles.textActive]}>🛠️ Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Input Kode Rahasia Admin */}
          {role === 'admin' && (
            <View>
              <Text style={[styles.label, { color: '#EF4444' }]}>Kode Rahasia Admin 店</Text>
              <TextInput
                style={[styles.input, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                placeholder="Masukkan token otentikasi pemilik"
                placeholderTextColor="#FCA3A3"
                secureTextEntry
                value={adminToken}
                onChangeText={setAdminToken}
              />
            </View>
          )}

          {/* Input PIN */}
          <Text style={styles.label}>PIN Keamanan (6 Angka)</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            value={pin}
            onChangeText={setPin}
          />

          {/* Input Konfirmasi PIN */}
          <Text style={styles.label}>Konfirmasi PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            value={confirmPin}
            onChangeText={setConfirmPin}
          />

          {/* Tombol Register */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Daftar Sekarang</Text>
            )}
          </TouchableOpacity>

          {/* Navigasi Ke Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  roleOptionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  textActive: {
    color: '#3B82F6',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
});
