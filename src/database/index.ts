import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import Order from './models/Order';
import OrderItem from './models/OrderItem';
import Product from './models/Product';
import User from './models/User'; // 1. Tambahkan import ini
import migrations from './migrations';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [Order, OrderItem, Product, User], // 2. Tambahkan User di sini
});

console.log('Database initialized:', !!database);