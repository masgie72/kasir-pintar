import { Q, Database } from '@nozbe/watermelondb';
import { Collection } from '@nozbe/watermelondb';
import PBKDF2 from 'crypto-js/pbkdf2';
import User from './models/User';

const SALT_KEY = 'toko-intan-salt-2026';

const SEED_USERS = [
  {
    name: 'Pemilik Toko (Owner)',
    email: 'ismetmasgie@gmail.com',
    pin: 'intan72',
    role: 'owner', 
  },
  {
    name: 'Administrator Toko',
    email: 'admin@toko.com',
    pin: 'admin123', 
    role: 'admin',  
  },
  {
    name: 'Kasir Utama',
    email: 'kasir1@toko.com',
    pin: 'kasir123', 
    role: 'kasir',  
  }
];

export const inisialisasiSuperUser = async (database: Database) => {
  if (!database) return;

  const usersCollection: Collection<User> = database.get<User>('users');

  try {
    for (const item of SEED_USERS) {
      const existing = await usersCollection.query(
        Q.where('email', item.email.toLowerCase().trim())
      ).fetchCount();

      if (existing > 0) {
        console.log(`Akun ${item.name} sudah ada, skip seeding.`);
        continue;
      }

      const hashedPin = PBKDF2(item.pin, SALT_KEY, {
        keySize: 256 / 32,
        iterations: 10000,
      }).toString();

           await database.write(async () => {
        await usersCollection.create((user: any) => {
          user.name = item.name;
          user.email = item.email.toLowerCase().trim();
          user.pinHash = hashedPin;  // 👑 Ganti kembali ke pinHash sesuai model terbaru
          user.role = item.role;
          user.isActive = true;      // 👑 Ganti kembali ke isActive
          user.updatedAt = new Date(); // 👑 Ganti kembali ke updatedAt
          user.isSynced = false;     // 👑 Ganti kembali ke isSynced
        });
      });


      console.log(`🚀 Akun ${item.name} (${item.role}) berhasil dibuat.`);
    }
  } catch (error) {
    console.error('Gagal menjalankan seeding user:', error);
  }
};
