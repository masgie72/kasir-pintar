import { Q, Database } from '@nozbe/watermelondb';
import { Collection } from '@nozbe/watermelondb';
import PBKDF2 from 'crypto-js/pbkdf2';
import User from './models/User';

// Konfigurasi data awal untuk Owner, Admin, dan Kasir
const SALT_KEY = 'toko-intan-salt-2026';

const SEED_USERS = [
  {
    name: 'Pemilik Toko (Owner)',
    email: 'ismetmasgie@gmail.com',
    pin: 'intan72',
    role: 'owner', // Akses penuh ke seluruh fitur dan laporan
  },
  {
    name: 'Administrator Toko',
    email: 'admin@toko.com',
    pin: 'admin123', // PIN untuk masuk akun Admin
    role: 'admin',  // Akses kelola stok & pengaturan, tapi dibatasi pada omzet utama
  },
  {
    name: 'Kasir Utama',
    email: 'kasir1@toko.com',
    pin: 'kasir123', // PIN untuk masuk akun Kasir
    role: 'kasir',  // Hanya bisa akses menu transaksi penjualan & riwayat struk
  }
];

export const inisialisasiSuperUser = async (database: Database) => {
  if (!database) return;

  const usersCollection: Collection<User> = database.get<User>('users');

  try {
    // Lakukan perulangan untuk mengecek dan memasukkan ketiga data seeder di atas
    for (const item of SEED_USERS) {
      const existing = await usersCollection.query(
        Q.where('email', item.email.toLowerCase().trim())
      ).fetchCount();

      // Jika email akun tersebut sudah terdaftar di database lokal, lewati pendaftaran
      if (existing > 0) {
        console.log(`Akun ${item.name} sudah ada, skip seeding.`);
        continue;
      }

      // Hashing PIN menggunakan pengaman PBKDF2 sesuai standar sistem keamanan login Anda
      const hashedPin = PBKDF2(item.pin, SALT_KEY, {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();

      // Tulis data pengguna baru ke database lokal WatermelonDB
      await database.write(async () => {
        await usersCollection.create(user => {
          user.name = item.name;
          user.email = item.email.toLowerCase().trim();
          user.pinHash = hashedPin;
          user.role = item.role;
          user.isActive = true;
          user.updatedAt = new Date();
          user.isSynced = false;
        });
      });

      console.log(`🚀 Akun ${item.name} (${item.role}) berhasil dibuat.`);
    }
  } catch (error) {
    console.error('Gagal menjalankan seeding user:', error);
  }
};
