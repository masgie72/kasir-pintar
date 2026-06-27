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

export default function RegisterKasirScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user_name').then(n => { if (n) setAdminName(n); });
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !pin || !confirmPin) {
      Alert.alert('Gagal', 'Semua kolom wajib diisi!');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Gagal', 'Format email tidak valid!');
      return;
    }
    if (pin.length !== 6 || confirmPin.length !== 6) {
      Alert.alert('Gagal', 'PIN harus terdiri dari 6 angka!');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Gagal', 'Konfirmasi PIN tidak cocok!');
      return;
    }

    setIsLoading(true);
    try {
      await createUser(name.trim(), email.toLowerCase().trim(), pin, 'kasir');
      Alert.alert(
        'Berhasil 🎉',
        `Akun Kasir [${email.trim()}] berhasil didaftarkan oleh ${adminName || 'Admin'}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Tambah Akun Kasir</Text>
          <Text style={styles.subtitle}>
            Daftarkan akun kasir baru untuk operasional toko.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama kasir"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

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

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Daftar Kasir</Text>
            )}
          </TouchableOpacity>
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
  button: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10B981',
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
});
