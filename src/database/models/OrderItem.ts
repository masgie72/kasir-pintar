
import { Model } from '@nozbe/watermelondb';
import { field, relation, text } from '@nozbe/watermelondb/decorators';

export default class OrderItem extends Model {
  static table = 'order_items';

  // 💡 PERBAIKAN: Tambahkan "as const" di akhir kurung kurawal
  static associations = {
    orders: { type: 'belongs_to', key: 'order_id' },
  } as const;

  @relation('orders', 'order_id') order: any;

  @text('name') name!: string;             
  @field('product_id') productId!: string; 
  @field('price') price!: number;          
  @field('quantity') quantity!: number;    
}

