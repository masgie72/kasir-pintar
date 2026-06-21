import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
// 💡 SOLUSI UTAMA: Impor tipe data 'Associations' dari WatermelonDB
import { Associations } from '@nozbe/watermelondb/Model';

export default class Order extends Model {
  static table = 'orders';

  // 💡 PERBAIKAN: Berikan tipe data 'Associations' secara eksplisit
  static associations: Associations = {
    order_items: { type: 'has_many', foreignKey: 'order_id' },
  };

  @children('order_items') orderItems: any;

  @field('user_id') userId!: string;      
  @field('total_price') totalPrice!: number; 
  @date('created_at') createdAt!: Date;    
}
