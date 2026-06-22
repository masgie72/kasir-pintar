import { database } from '../database';

export const createOrder = async (
  userId: string,
  totalPrice: number,
  items: any[],
  deviceId: string
) => {
  const db = database;
  if (!db) throw new Error('Database tidak terinisialisasi!');

  await db.write(async () => {
    const orders = db.get('orders');
    const orderItems = db.get('order_items');
    const products = db.get('products');

    const newOrder = orders.prepareCreate((order: any) => {
  order.userId = userId;
  order.totalPrice = totalPrice;
  order.status = 'paid';
  order.deviceId = deviceId;
  order.createdAt = new Date(); // <-- bukan Date.now()
  order.updatedAt = new Date();
  order.isSynced = false;
  order.deletedAt = null;
});

    const batch: any[] = [newOrder];

    for (const item of items) {
      const newItem = orderItems.prepareCreate((oi: any) => {
        oi.order.set(newOrder);
        oi.productId = item.productId;
        oi.name = item.name;
        oi.price = Number(item.price);
        oi.quantity = Number(item.quantity);
        oi.deviceId = deviceId; // <-- baru
        oi.updatedAt = Date.now();
        oi.isSynced = false;
      });
      batch.push(newItem);

      // potong stok lokal (tetap jalan, nanti server yang jadi sumber utama)
      try {
        const product = await products.find(item.productId);
        if (product) {
          const upd = product.prepareUpdate((p: any) => {
            p.stock = Number(p.stock || 0) - Number(item.quantity);
            p.updatedAt = Date.now();
            p.isSynced = false;
          });
          batch.push(upd);
        }
      } catch {}
    }

    await db.batch(batch);
  });
};
