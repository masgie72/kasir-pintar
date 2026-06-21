import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 4, // Diubah ke versi 3 karena ada penambahan indeks baru
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // Ditambahkan indeks untuk relasi ke tabel users
        { name: 'total_price', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'order_items',
      columns: [
        { name: 'order_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' }, // 💡 Tambahkan baris ini agar nama produk terdaftar di skema
        { name: 'price', type: 'number' },
        { name: 'quantity', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' }, // Dipakai oleh pencarian filter nama di halaman utama
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isIndexed: true }, // Ditambahkan indeks untuk mempermudah proses pencarian login via email
        { name: 'pin', type: 'string' },
        { name: 'role', type: 'string' },
      ],
    }),
  ],
});
