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
import { useTheme } from '../theme/ThemeContext';
import { database } from '../database';
import User from '../database/models/User';

type Props = {
  navigation: any;
  onLoginSuccess: () => void;
};

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const { theme } = useTheme();
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
        if (user.pinHash === hashedInput) {
          await saveUserSession(user.id);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('user_role', user.role); 
          await AsyncStorage.setItem('user_name', user.name);
          await AsyncStorage.setItem('user_id', user.id);
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
      style={[styles.container, { backgroundColor: theme.background }]}
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
          <Text style={[styles.title, { color: theme.text }]}>Kasir Pintar</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Mempermudah pengelolaan transaksi bisnis Anda
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.card, shadowColor: theme.text }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Alamat Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="contoh@toko.com"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>PIN Keamanan (6 Digit)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            placeholder="******"
            placeholderTextColor={theme.textSecondary}
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

          {/* FOOTER BARU: Menggantikan Register dengan teks Copyright */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              &copy; 2026 Kasir Pintar. All Rights Reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  headerContainer: { marginBottom: 28, alignItems: 'center' },
  logoImage: { width: 90, height: 90, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 12, fontWeight: '500' },
});
