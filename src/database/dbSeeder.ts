import { Q, Database } from '@nozbe/watermelondb';
import { Collection } from '@nozbe/watermelondb';
import PBKDF2 from 'crypto-js/pbkdf2';
import User from './models/User';

const SUPERUSER_CONFIG = {
  name: 'Pemilik Toko (SuperUser)',
  email: 'ismetmasgie@gmail.com',
  pin: 'intan72',
  salt: 'toko-intan-salt-2026',
};

export const inisialisasiSuperUser = async (database: Database) => {
  if (!database) return;

  const users: Collection<User> = database.get<User>('users');

  try {
    const existing = await users.query(
      Q.where('email', SUPERUSER_CONFIG.email)
    ).fetchCount();

    if (existing > 0) {
      console.log('SuperUser sudah ada, skip seeding');
      return;
    }

    const hashedPin = PBKDF2(SUPERUSER_CONFIG.pin, SUPERUSER_CONFIG.salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    await database.write(async () => {
      await users.create(user => {
        user.name = SUPERUSER_CONFIG.name;
        user.email = SUPERUSER_CONFIG.email;
        user.pinHash = hashedPin;
        user.role = 'superuser';
        user.isActive = true;
        user.updatedAt = new Date();
        user.isSynced = false;
      });
    });

    console.log('🚀 Akun SuperUser berhasil dibuat');
  } catch (error) {
    console.error('Gagal seeding SuperUser:', error);
  }
};
