import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import OrderItem from './OrderItem';
import Category from './Category';

export default class Product extends Model {
  static table = 'products';

  static associations: Associations = {
    order_items: { type: 'has_many', foreignKey: 'product_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
  } as const;

  @field('name') name!: string;
  @field('barcode') barcode!: string;
  @field('price') price!: number;
  @field('stock') stock!: number;
  @field('is_active') isActive!: boolean;
  @field('device_id') deviceId!: string;
  @field('cost_price') costPrice!: number;
  @field('category_id') categoryId!: string;

  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;

  @children('order_items') orderItems!: Relation<OrderItem>;
  @relation('categories', 'category_id') category!: Relation<Category>;
}