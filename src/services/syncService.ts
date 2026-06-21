
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../database';

const API_URL = 'https://api.backendserver Anda.com';

export const syncDatabase = async (): Promise<void> => {
  try {
    await synchronize({
      database,
      
      // 1. TARIK DATA DARI SERVER (PULL)
      pullChanges: async ({ lastPulledAt, schemaVersion }) => {
        const response = await fetch(
          `${API_URL}/sync?last_pulled_at=${lastPulledAt || 0}&schema_version=${schemaVersion}`
        );
        
        if (!response.ok) {
          throw new Error('Gagal menarik data dari server');
        }

        const { changes, timestamp } = await response.json();
        return { changes, timestamp };
      },

      // 2. KIRIM DATA LOKAL KE SERVER (PUSH)
      pushChanges: async ({ changes, lastPulledAt }) => {
        const response = await fetch(`${API_URL}/sync?last_pulled_at=${lastPulledAt}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(changes),
        });

        if (!response.ok) {
          throw new Error('Gagal mengirim data ke server');
        }
      },
      
      // Properti migrationsKey yang menyebabkan error telah dihapus di sini
    });
    
    console.log('Sinkronisasi database berhasil!');
  } catch (error) {
    console.error('Gagal melakukan sinkronisasi:', error);
    throw error;
  }
};

