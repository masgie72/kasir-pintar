import { database } from '../database';

export const createOrder = async (userId: string, totalPrice: number, items: any[]) => {
  const db = database;
  if (!db) {
    throw new Error('Database tidak terinisialisasi!');
  }

  try {
    await db.write(async () => {
      const ordersCollection = db.get('orders');
      const orderItemsCollection = db.get('order_items');
      const productsCollection = db.get('products'); // 💡 1. Panggil koleksi produk

      // Siapkan pembuatan data induk Pesanan (Header)
      const newOrder = ordersCollection.prepareCreate((order: any) => {
        order.userId = userId;
        order.totalPrice = totalPrice;
        order.createdAt = new Date();
      });

      // Siapkan array kosong untuk mengumpulkan tugas operasi batch SQLite
      const batchRecords: any[] = [newOrder];

      // Lakukan perulangan untuk setiap item di keranjang belanja
      for (const item of items) {
        // A. Siapkan pencatatan rincian barang belanjaan (Detail)
        const newOrderItem = orderItemsCollection.prepareCreate((orderItem: any) => {
          orderItem.order.set(newOrder);
          orderItem.name = item.name;
          orderItem.productId = item.productId;
          orderItem.price = Number(item.price);
          orderItem.quantity = Number(item.quantity);
        });
        batchRecords.push(newOrderItem);

        // B. 💡 SOLUSI UTAMA: Cari produk asli di database berdasarkan ID untuk dikurangi stoknya
        try {
          const product = await productsCollection.find(item.productId);
          
          if (product) {
            // Siapkan perintah pembaruan data stok produk secara aman
            const updatedProduct = product.prepareUpdate((p: any) => {
              // Kurangi nilai stok asli dengan jumlah kuantitas yang dibeli kasir
              p.stock = Number(p.stock || 0) - Number(item.quantity);
            });
            batchRecords.push(updatedProduct);
          }
        } catch (findError) {
          console.warn(`Produk dengan ID ${item.productId} tidak ditemukan di gudang, melewati pemotongan stok.`);
        }
      }

      // 💡 2. Eksekusi penulisan massal serentak (Simpan Transaksi + Potong Stok Sekaligus!)
      await db.batch(batchRecords);
    });
    
    console.log("Transaksi berhasil disimpan dan stok produk otomatis terpotong!");
  } catch (error) {
    console.error("Gagal melakukan checkout secara internal:", error);
    throw error;
  }
};
