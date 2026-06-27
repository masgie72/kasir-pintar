import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Customer extends Model {
  static table = 'customers';

  @field('name') name!: string;
  @field('phone') phone!: string;
  @field('email') email!: string;
  @field('address') address!: string;
  @field('is_active') isActive!: boolean;
  @field('device_id') deviceId!: string;

  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;
}
