import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import PBKDF2 from 'crypto-js/pbkdf2';
import { saveUserSession } from '../services/authService';
import { database } from '../database';
import User from '../database/models/User';

type Props = {
  navigation: any;
  onLoginSuccess: () => void;
};

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pin) {
      Alert.alert('Error', 'Mohon isi email dan PIN!');
      return;
    }

    setIsLoading(true);

    try {
      const hashedInput = PBKDF2(pin, 'toko-intan-salt-2026', {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();
      const usersCollection = database.get<User>('users');
      const users = await usersCollection
        .query(Q.where('email', email.toLowerCase().trim()))
        .fetch();

      if (users.length > 0) {
        const user = users[0];
        if (user.pin === hashedInput) {
          await saveUserSession(user.id);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('userRole', user.role);
          onLoginSuccess();
        } else {
          Alert.alert('Gagal', 'PIN salah!');
        }
      } else {
        Alert.alert('Gagal', 'Email tidak terdaftar!');
      }
    } catch (error) {
      console.error('Login Error:', error);
      Alert.alert('Error', 'Terjadi kesalahan pada database.');
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
          <Image
            source={require('../assets/playstore.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Kasir Pintar</Text>
          <Text style={styles.subtitle}>
            Mempermudah pengelolaan transaksi bisnis Anda
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Alamat Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh@toko.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>PIN Keamanan (6 Digit)</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            placeholderTextColor="#94A3B8"
            value={pin}
            onChangeText={setPin}
            maxLength={12}
            secureTextEntry
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Masuk Ke Aplikasi</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  headerContainer: { marginBottom: 28, alignItems: 'center' },
  logoImage: { width: 90, height: 90, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B', fontSize: 14 },
  registerLink: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
});
