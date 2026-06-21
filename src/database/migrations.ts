import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
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
            { name: 'name', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'quantity', type: 'number' },
          ],
        }),
      ],
    },
    {
      // v4: tambah products dan users
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
            { name: 'role', type: 'string' },
          ],
        }),
      ],
    },
    {
      // v5: versi bersih - siap sync + POS
      toVersion: 5,
      steps: [
        // orders
        addColumns({
          table: 'orders',
          columns: [
            { name: 'shift_id', type: 'string', isIndexed: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'payment_method', type: 'string' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        // order_items
        addColumns({
          table: 'order_items',
          columns: [
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        // products
        addColumns({
          table: 'products',
          columns: [
            { name: 'barcode', type: 'string', isIndexed: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        // users
        addColumns({
          table: 'users',
          columns: [
            { name: 'pin_hash', type: 'string' },
            { name: 'is_active', type: 'boolean' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        // index untuk kolom lama yang belum ada index
        { type: 'sql', sql: 'CREATE INDEX IF NOT EXISTS products_name ON products (name)' },
        { type: 'sql', sql: 'CREATE INDEX IF NOT EXISTS users_role ON users (role)' },
      ],
    },
  ],
})
