import { Q } from '@nozbe/watermelondb';
import { database } from '../database'; 
import User from '../database/models/User';
import PBKDF2 from 'crypto-js/pbkdf2'; // Mengubah SHA256 menjadi PBKDF2

const usersCollection = database.get<User>('users');
const SALT_KEY = 'toko-intan-salt-2026'; // Salt yang sama seperti di Login & Seeder

// Fungsi pembantu untuk standarisasi enkripsi PIN di seluruh sistem toko
const hashPinSecurity = (pin: string): string => {
  return PBKDF2(pin, SALT_KEY, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
};

// 1. CREATE - Menambah User Baru (Dipanggil oleh RegisterScreen)
export const createUser = async (name: string, email: string, pin: string, role: string) => {
  const hashedPin = hashPinSecurity(pin);

  await database.write(async () => {
    await usersCollection.create((newUser: any) => {
      newUser.name = name;
      newUser.email = email.toLowerCase().trim();
      newUser.pinHash = hashedPin; // Disesuaikan dengan field 'pinHash' pada model User Anda
      newUser.role = role; 
      newUser.isActive = true;
      newUser.updatedAt = new Date();
      newUser.isSynced = false;
    });
  });
};

// 2. READ - Mengambil Semua User 
export const getAllUsers = () => {
  return usersCollection.query();
};

/// 1. UPDATE USER (Hanya diizinkan jika pelakunya adalah owner)
export const updateUserWithAuth = async (
  currentUserRole: string, 
  user: User, 
  updatedData: { name?: string; email?: string; pin?: string }
): Promise<void> => {
  // Blokir di tingkat database jika bukan owner
  if (currentUserRole !== 'owner') {
    throw new Error('Otoritas tidak sah! Anda bukan pemilik toko.');
  }

  await database.write(async () => {
    await user.update((u: any) => {
      if (updatedData.name !== undefined) u.name = updatedData.name;
      if (updatedData.email !== undefined) u.email = updatedData.email.toLowerCase().trim();
      if (updatedData.pin !== undefined) {
        u.pinHash = hashPinSecurity(updatedData.pin);
      }
      u.updatedAt = new Date();
    });
  });
};

// 2. DELETE USER (Hanya diizinkan jika pelakunya adalah owner)
export const deleteUserWithAuth = async (currentUserRole: string, user: User): Promise<void> => {
  if (currentUserRole !== 'owner') {
    throw new Error('Otoritas tidak sah! Anda bukan pemilik toko.');
  }
  if (user.role === 'owner') {
    throw new Error('Akun Owner utama tidak bisa dihapus.');
  }

  await database.write(async () => {
    await user.markAsDeleted(); 
  });
};


// 5. VALIDASI LOGIN
export const verifyUserLogin = async (email: string, inputPin: string): Promise<boolean> => {
  try {
    const hashedInput = hashPinSecurity(inputPin);
    
    const users = await usersCollection
      .query(Q.where('email', email.toLowerCase().trim()))
      .fetch();

    if (users.length === 0) return false;

    const user = users[0];
    return user.pinHash === hashedInput; 
  } catch (error) {
    return false;
  }
};
