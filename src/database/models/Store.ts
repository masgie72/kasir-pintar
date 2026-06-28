import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Store extends Model {
  static table = 'stores';

  @field('name') name!: string;
  @field('address') address!: string;
  @field('ppn_percentage') ppnPercentage!: number;
  @field('device_id') deviceId!: string;

  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;
}
