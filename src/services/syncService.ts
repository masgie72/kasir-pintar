import { database } from '../database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import Order from '../database/models/Order';

const API_URL = __DEV__ ? 'http://10.0.2.2:3000/sync' : 'https://api-kasirmu.com/sync';

export async function syncData() {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    const deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) return;

    const ordersCollection = database.get<Order>('orders');

    // UPLOAD
    const unsynced = await ordersCollection.query(Q.where('is_synced', false)).fetch();
    if (unsynced.length) {
      await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, orders: unsynced.map(o => o._raw) }),
      });

      await database.write(async () => {
        for (const o of unsynced) {
          await o.update(ord => { ord.isSynced = true; });
        }
      });
    }

    // DOWNLOAD
    const lastSync = await AsyncStorage.getItem('last_sync') || '0';
    const res = await fetch(`${API_URL}/download?since=${lastSync}&deviceId=${deviceId}`);
    if (!res.ok) return;

    const { orders } = await res.json();

    await database.write(async () => {
      for (const remote of orders) {
        const local = await ordersCollection.find(remote.id).catch(() => null);

        if (!local) {
          await ordersCollection.create(o => {
            Object.assign(o._raw, { ...remote, is_synced: true });
          });
        } else if (remote.updated_at > local.updatedAt.getTime()) {
          await local.update(o => {
            Object.assign(o._raw, { ...remote, is_synced: true });
          });
        }
      }
    });

    await AsyncStorage.setItem('last_sync', Date.now().toString());
  } catch {
    // offline, diamkan
  }
}
