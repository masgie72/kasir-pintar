
import { database } from '../database'; // Sesuaikan dengan path database Anda
import { Q } from '@nozbe/watermelondb';

export const registerUser = async (name: string, email: string, pin: string) => {
  const existingUsers = await database.get('users')
    .query(Q.where('email', email))
    .fetch();

  if (existingUsers.length > 0) {
    throw new Error('Email sudah terdaftar!');
  }
  try {
    await database.write(async () => {
      await database.get('users').create((user: any) => {
        user.name = name;
        user.email = email;
        user.pin = pin;
      });
    });
    console.log('User berhasil didaftarkan');
  } catch (error) {
    console.error('Gagal mendaftarkan user:', error);
    throw error;
  }

};