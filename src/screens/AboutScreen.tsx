import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();

  const openEmail = () => {
    Linking.openURL('mailto:ismetmasgie@gmail.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://github.com/masgie72/kasir-pintar.git');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={[styles.logoWrapper, { backgroundColor: theme.primaryLight }]}>
          <Image
            source={require('../assets/playstore.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Kasir Pintar</Text>
        <Text style={[styles.version, { color: theme.textSecondary }]}>Versi 1.0.0</Text>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tentang Pengembang</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Kasir Pintar dikembangkan oleh tim developer yang berdedikasi untuk membantu UMKM 
          dalam mengelola transaksi dengan mudah dan efisien. Aplikasi ini menggunakan 
          teknologi React Native dengan WatermelonDB untuk penyimpanan lokal yang cepat.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tim Pengembang</Text>
        <View style={styles.devList}>
          <Text style={[styles.devItem, { color: theme.textSecondary }]}>• Developer: Slamet Sugiman</Text>
          <Text style={[styles.devItem, { color: theme.textSecondary }]}>• UI/UX Designer: Tim Kasir Pintar</Text>
          <Text style={[styles.devItem, { color: theme.textSecondary }]}>• QA Tester: Tim Pengembangan</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Kontak Pengembang</Text>
        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.primary }]} onPress={openEmail}>
          <Text style={styles.contactBtnText}>📧 Email: ismetmasgie@gmail.com</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={openWebsite}>
          <Text style={[styles.contactBtnText, { color: theme.text }]}>🌐 Website: https://github.com/masgie72/kasir-pintar</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.copyright, { color: theme.textSecondary }]}>
        &copy; 2026 Kasir Pintar. All Rights Reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: { width: 50, height: 50 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  version: { fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8, alignSelf: 'flex-start' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'left' },
  devList: { alignSelf: 'flex-start' },
  devItem: { fontSize: 14, marginBottom: 4 },
  contactBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 0,
  },
  contactBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  copyright: { fontSize: 12, marginTop: 28, fontWeight: '500', textAlign:'center' },
});