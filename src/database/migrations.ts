import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

const migrations = schemaMigrations({
  migrations: [
    {
      // v2: pertama kali bikin orders
      toVersion: 2,
      steps: [
        createTable({
          name: 'orders',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'total_price', type: 'number' },
            { name: 'created_at', type: 'number', isIndexed: true },
          ],
        }),
      ],
    },
    {
      // v3: tambah order_items dengan snapshot nama produk
      toVersion: 3,
      steps: [
        createTable({
          name: 'order_items',
          columns: [
            { name: 'order_id', type: 'string', isIndexed: true },
            { name: 'product_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' }, // ini yang kamu tandai 💡
            { name: 'price', type: 'number' },
            { name: 'quantity', type: 'number' },
          ],
        }),
      ],
    },
    {
      // v4: tambah products dan users, sekalian index email
      toVersion: 4,
      steps: [
        createTable({
          name: 'products',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
          ],
        }),
        createTable({
          name: 'users',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string', isIndexed: true },
            { name: 'pin', type: 'string' },
            { name: 'role', type: 'string' }, // ini yang ketinggalan di file kamu
          ],
        }),
      ],
    },
  ],
});

export default migrations;
