import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import migrations from './migrations';
import Order from './models/Order';
import OrderItem from './models/OrderItem';
import Product from './models/Product';
import User from './models/User';
import Customer from './models/Customer';
import Category from './models/Category';
import Store from './models/Store';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'toko_intan_db',
});

export const database = new Database({
  adapter,
  modelClasses: [Order, OrderItem, Product, User, Customer, Category, Store],
});

if (__DEV__) {
  console.log('Database initialized:', !!database);
}
