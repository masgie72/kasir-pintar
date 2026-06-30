import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import OrderItem from './OrderItem';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../database';
import User from './User';

export default class Order extends Model {
  static table = 'orders';

  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
    order_items: { type: 'has_many', foreignKey: 'order_id' },
  } as const;

  @field('user_id') userId!: string;
  @field('shift_id') shiftId!: string;
  @field('total_price') totalPrice!: number;
  @field('status') status!: string;
  @field('payment_method') paymentMethod!: string;
  @field('amount_paid') amountPaid!: number;
  
  // BARU untuk multi-kasir
  @field('device_id') deviceId!: string;
  @field('deleted_at') deletedAt!: number | null;
  
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;

  @relation('users', 'user_id') user!: Relation<User>;
  @children('order_items') orderItems!: Relation<OrderItem>;
}

export const getActiveUserHistoryWithItems = async (activeUserId: string, limit: number = 50) => {
  // Batasi dengan limit agar aplikasi tidak memuat ribuan order sekaligus ke memori
  const orders = await database.get<Order>('orders').query(
    Q.where('user_id', activeUserId),
    Q.sortBy('created_at', Q.desc),
    Q.take(limit) // <--- Tambahkan limit di sini
  ).fetch();

  // Optimasi: Gunakan Promise.all dengan batas batching jika data sangat besar
  const fullHistory = await Promise.all(
    orders.map(async (order) => {
      // Mengambil data item langsung dari model Order (sudah benar)
      const items = await order.orderItems.fetch();
      return {
        order,
        items,
      };
    })
  );

  return fullHistory;
};