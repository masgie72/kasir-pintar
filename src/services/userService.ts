import { Q } from '@nozbe/watermelondb';

import { database } from '../database'; // Sesuaikan dengan jalur file inisialisasi database Anda
import User from '../database/models/User';
import SHA256 from 'crypto-js/sha256'; 


const usersCollection = database.get<User>('users');

// 1. CREATE - Menambah User Baru
export const createUser = async (name: string, email: string, pin: string, role: string) => {
  const hashedPassword = SHA256(pin).toString();

  const { database } = require('../database'); 
  
  await database.write(async () => {
    await database.get('users').create((newUser: any) => {
      newUser.name = name;
      newUser.email = email;
      newUser.pin = hashedPassword;
      newUser.role = role; 
    });
  });
};
// 2. READ - Mengambil Semua User (Gunakan .observe() di UI untuk sinkronisasi otomatis)
export const getAllUsers = () => {
  return usersCollection.query();
};

// 3. UPDATE - Memperbarui Data User
export const updateUser = async (user: User, updatedData: { name?: string; email?: string; pin?: string }): Promise<void> => {
  const { database } = require('../database'); 
  await database.write(async () => {
    await user.update((u) => {
      if (updatedData.name !== undefined) u.name = updatedData.name;
      if (updatedData.email !== undefined) u.email = updatedData.email;
      if (updatedData.pin !== undefined) {
        u.pin = SHA256(updatedData.pin).toString();
      };
    });
  });
};

// 4. DELETE - Menghapus User
export const deleteUser = async (user: User): Promise<void> => {
  const { database } = require('../database'); 
  await database.write(async () => {
    await user.markAsDeleted(); // Menghapus secara lokal dan siap disinkronisasikan jika menggunakan fitur sync
    // atau gunakan: await user.destroyPermanently(); jika ingin langsung terhapus permanen dari database lokal
  });
};
export const verifyUserLogin = async (email: string, inputPin: string): Promise<boolean> => {
  try {
    const hashedInput = SHA256(inputPin).toString(); // Enkripsi PIN yang dimasukkan kasir
     const { database } = require('../database');
    const usersCollection = database.get('users');
    
   const users = await usersCollection
      .query(Q.where('email', email.toLowerCase().trim()))
      .fetch();

    if (users.length === 0) return false; // User tidak ditemukan

    const user = users[0];

    // Bandingkan hash input dengan hash di database
    return user.pin === hashedInput; 
  } catch (error) {
    return false;
  }
};