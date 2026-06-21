import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 4, // naik dari 3 karena tambah index di users.email dan orders.user_id
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'total_price', type: 'number' },
        { name: 'created_at', type: 'number', isIndexed: true }, // opsional: biar sort by tanggal cepat
      ],
    }),
    tableSchema({
      name: 'order_items',
      columns: [
        { name: 'order_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' }, // snapshot nama produk saat dibeli
        { name: 'price', type: 'number' },
        { name: 'quantity', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'pin', type: 'string' },
        { name: 'role', type: 'string' },
      ],
    }),
  ],
});
