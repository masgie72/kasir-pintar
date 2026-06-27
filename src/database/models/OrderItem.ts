import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import Order from './Order';
import Product from './Product';

export default class OrderItem extends Model {
  static table = 'order_items';

  // Asosiasi yang terdefinisi dengan jelas untuk mempermudah join query
  static associations: Associations = {
    orders: { type: 'belongs_to', key: 'order_id' },
    products: { type: 'belongs_to', key: 'product_id' },
  } as const;

  // Fields
  @field('order_id') orderId!: string;
  @field('product_id') productId!: string;
  @field('name') name!: string;
  @field('price') price!: number;
  @field('quantity') quantity!: number;
  
  // Field sinkronisasi untuk menjaga integritas data dengan server
  @field('is_synced') isSynced!: boolean;
  @date('updated_at') updatedAt!: Date;

  // Relasi: Menggunakan @relation untuk memudahkan pengambilan data terkait
  @relation('orders', 'order_id') order!: Relation<Order>;
  @relation('products', 'product_id') product!: Relation<Product>;
}