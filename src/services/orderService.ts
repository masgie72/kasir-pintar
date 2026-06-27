import { database } from '../database';

export const createOrder = async (
  userId: string,
  totalPrice: number,
  items: any[],
  deviceId: string,
  paymentMethod: string = 'cash',
  customerId?: string,
): Promise<string> => {
  const db = database;
  if (!db) throw new Error('Database tidak terinisialisasi!');

  let createdOrderId: string = '';

  await db.write(async () => {
    const orders = db.get('orders');
    const orderItems = db.get('order_items');
    const products = db.get('products');

    const newOrder = orders.prepareCreate((order: any) => {
      order.userId = userId;
      order.totalPrice = totalPrice;
      order.status = 'paid';
      order.paymentMethod = paymentMethod;
      order.shiftId = 'shift-' + deviceId + '-' + Date.now();
      order.deviceId = deviceId;
      order.createdAt = new Date();
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
        oi.deviceId = deviceId;
        oi.updatedAt = Date.now();
        oi.isSynced = false;
        oi.costPrice = Number(item.costPrice || 0);
      });
      batch.push(newItem);

      try {
        const product = await products.find(item.productId as any);
        if (!product) {
          console.warn('[Order] Produk tidak ditemukan:', item.productId);
          continue;
        }
        if ((Number((product as any).stock || (product as any)._raw?.stock) || 0) <= 0) {
          console.warn('[Order] Stok habis:', item.productId);
          continue;
        }
        const upd = product.prepareUpdate((p: any) => {
          p.stock = Math.max(0, Number(p.stock || 0) - Number(item.quantity));
          p.updatedAt = Date.now();
          p.isSynced = false;
        });
        batch.push(upd);
      } catch (e) {
        console.warn('[Order] Gagal update stok:', item.productId, e);
      }
    }

    await db.batch(batch);
    createdOrderId = newOrder.id;
  });

  return createdOrderId;
};
