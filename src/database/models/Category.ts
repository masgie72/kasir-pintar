import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  @field('name') name!: string;
  @field('description') description!: string;
  @field('device_id') deviceId!: string;

  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;
}
