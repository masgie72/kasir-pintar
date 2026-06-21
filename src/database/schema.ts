import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 5,
  tables: [
    // TRANSAKSI
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'shift_id', type: 'string', isIndexed: true },
        { name: 'total_price', type: 'number' },
        { name: 'status', type: 'string', isIndexed: true }, // paid, void, draft
        { name: 'payment_method', type: 'string' }, // cash, qris, debit
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'order_items',
      columns: [
        { name: 'order_id', type: 'string', isIndexed: true },
        { name: 'product_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' }, // snapshot
        { name: 'price', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),

    // MASTER DATA
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'barcode', type: 'string', isIndexed: true },
        { name: 'price', type: 'number' },
        { name: 'stock', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'pin_hash', type: 'string' }, // simpan hash, bukan pin plain
        { name: 'role', type: 'string', isIndexed: true }, // kasir, admin
        { name: 'is_active', type: 'boolean' },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
  ],
})
