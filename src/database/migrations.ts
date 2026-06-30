import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
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
      toVersion: 5,
      steps: [
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
        addColumns({
          table: 'order_items',
          columns: [
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        addColumns({
          table: 'products',
          columns: [
            { name: 'barcode', type: 'string', isIndexed: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
        addColumns({
          table: 'users',
          columns: [
            { name: 'pin_hash', type: 'string' },
            { name: 'is_active', type: 'boolean' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        addColumns({
          table: 'orders',
          columns: [
            { name: 'device_id', type: 'string', isIndexed: true },
            { name: 'deleted_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'order_items',
          columns: [
            { name: 'device_id', type: 'string', isIndexed: true },
          ],
        }),
        addColumns({
          table: 'products',
          columns: [
            { name: 'device_id', type: 'string', isIndexed: true },
            { name: 'deleted_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: 'customers',
          columns: [
            { name: 'name', type: 'string', isIndexed: true },
            { name: 'phone', type: 'string', isIndexed: true },
            { name: 'email', type: 'string', isIndexed: true },
            { name: 'address', type: 'string' },
            { name: 'is_active', type: 'boolean' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
            { name: 'deleted_at', type: 'number' },
            { name: 'device_id', type: 'string', isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        addColumns({
          table: 'products',
          columns: [{ name: 'cost_price', type: 'number' }],
        }),
        addColumns({
          table: 'order_items',
          columns: [{ name: 'cost_price', type: 'number' }],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        createTable({
          name: 'categories',
          columns: [
            { name: 'name', type: 'string', isIndexed: true },
            { name: 'description', type: 'string' },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
            { name: 'deleted_at', type: 'number' },
            { name: 'device_id', type: 'string', isIndexed: true },
          ],
        }),
        addColumns({
          table: 'products',
          columns: [{ name: 'category_id', type: 'string', isIndexed: true }],
        }),
      ],
    },
    {
      toVersion: 10,
      steps: [
        createTable({
          name: 'stores',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'address', type: 'string' },
            { name: 'phone', type: 'string' },
            { name: 'ppn_percentage', type: 'number' },
            { name: 'device_id', type: 'string', isIndexed: true },
            { name: 'updated_at', type: 'number', isIndexed: true },
            { name: 'is_synced', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      toVersion: 11,
      steps: [
        addColumns({
          table: 'orders',
          columns: [{ name: 'amount_paid', type: 'number' }],
        }),
      ],
    },
  ],
})
