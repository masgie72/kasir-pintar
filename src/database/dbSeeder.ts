import { Q } from '@nozbe/watermelondb';
import SHA256 from 'crypto-js/sha256';

// 💡 Tegaskan parameter (databaseInstance: any) di sini
export const inisialisasiSuperUser = async (databaseInstance: any) => {
  try {
    if (!databaseInstance) return;

    const usersCollection = databaseInstance.get('users');

    // Periksa apakah sudah ada superuser
    const superUsers = await usersCollection
      .query(Q.where('role', 'superuser'))
      .fetch();

    if (superUsers.length === 0) {
      const pinBawaan = 'intan72';
      const hashedPin = SHA256(pinBawaan).toString();

      await databaseInstance.write(async () => {
        await usersCollection.create((newUser: any) => {
          newUser.name = 'Pemilik Toko (SuperUser)';
          newUser.email = 'ismetmasgie@gmail.com';
          newUser.pin = hashedPin;
          newUser.role = 'superuser';
        });
      });

      console.log('🚀 Akun SuperUser berhasil dibuat!');
    }
  } catch (error) {
    console.error('Gagal melakukan seeding SuperUser:', error);
  }
};
