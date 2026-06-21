import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import OrderItem from './OrderItem';
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
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;

  @relation('users', 'user_id') user!: Relation<User>;
  @children('order_items') orderItems!: Relation<OrderItem>;
}
