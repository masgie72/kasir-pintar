import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import Order from './models/Order';
import OrderItem from './models/OrderItem';
import Product from './models/Product';
import User from './models/User';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'kasir_pintar',
  jsi: true,
  onSetUpError: error => {
    console.log('[DB] Setup Error:', error);
    if (__DEV__) throw error;
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Order, OrderItem, Product, User],
});

if (__DEV__) {
  console.log('Database initialized:', !!database);
}
