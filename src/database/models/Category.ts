import { Model, Relation } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import Product from './Product';

export default class Category extends Model {
  static table = 'categories';

  static associations: Associations = {
    products: { type: 'has_many', foreignKey: 'category_id' },
  } as const;

  @field('name') name!: string;
  @field('description') description!: string;
  @field('device_id') deviceId!: string;

  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;

  @children('products') products!: Relation<Product>;
}
