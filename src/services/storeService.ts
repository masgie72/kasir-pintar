import { database } from '../database';
import Store from '../database/models/Store';

const storesCollection = database.get<Store>('stores');

export const getStore = async (): Promise<Store | null> => {
  try {
    const stores = await storesCollection.query().fetch();
    return stores.length > 0 ? stores[0] : null;
  } catch (error) {
    console.error('Gagal mengambil data toko:', error);
    return null;
  }
};

export const createOrUpdateStore = async (
  name: string,
  address: string,
  phone: string
): Promise<void> => {
  await database.write(async () => {
    const existing = await getStore();
    if (existing) {
      await existing.update((s: any) => {
        s.name = name.trim();
        s.address = address.trim();
        s.phone = phone.trim();
        s.updatedAt = new Date();
      });
    } else {
      await storesCollection.create((s: any) => {
        s.name = name.trim();
        s.address = address.trim();
        s.phone = phone.trim();
        s.ppnPercentage = 0;
        s.deviceId = '';
        s.updatedAt = new Date();
        s.isSynced = false;
      });
    }
  });
};

export type StoreData = {
  name: string;
  address: string;
  phone: string;
};

export const getStoreData = async (): Promise<StoreData> => {
  const store = await getStore();
  return {
    name: store?.name ?? 'TOKO SUKSES',
    address: store?.address ?? 'Jl. Pahlawan No. 10, Tegal',
    phone: store?.phone ?? '0812-3456-7890',
  };
};