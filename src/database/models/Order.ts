import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import { Relation } from '@nozbe/watermelondb';
import OrderItem from './OrderItem';

export default class Order extends Model {
  static table = 'orders';

  static associations: Associations = {
    order_items: { type: 'has_many', foreignKey: 'order_id' },
  };

  @children('order_items') orderItems!: Relation<OrderItem>;

  @field('user_id') userId!: string;
  @field('total_price') totalPrice!: number;
  @date('created_at') createdAt!: Date; // sekarang bertipe Date
}
