import { schemaMigrations, createTable, addColumns  } from '@nozbe/watermelondb/Schema/migrations';

const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'products',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'price', type: 'number' },
            { name: 'stock', type: 'number' },
          ],
        }),
      ],
    },
    {
      // TAMBAHKAN BLOK INI: Jalur migrasi dari versi 2 ke versi 3
      toVersion: 4,
      steps: [
        // Contoh jika Anda menambahkan tabel 'users' baru di versi 3:
        createTable({
          name: 'users',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string', isIndexed: true },
            { name: 'pin', type: 'string' },
          ],
        }),
        // Atau contoh jika Anda hanya menambah kolom baru ke tabel yang sudah ada:
        // addColumns({
        //   table: 'products',
        //   columns: [{ name: 'new_column', type: 'string', isOptional: true }]
        // })
      ],
    },
  ],
});

export default migrations; // Pastikan ada export default