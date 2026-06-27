import { Model, Query } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';
import Order from './Order';

export default class User extends Model {
  static table = 'users';
  
  static associations: Associations = {
    orders: { type: 'has_many', foreignKey: 'user_id' },
  } as const;

  @field('name') name!: string;
  @field('email') email!: string;
  @field('pin_hash') pinHash!: string;
  @field('role') role!: string;
  @field('is_active') isActive!: boolean;
  @field('device_id') deviceId!: string; // Penting untuk membatasi akses per perangkat
  
  @date('updated_at') updatedAt!: Date;
  @field('is_synced') isSynced!: boolean;

  // Menggunakan @children untuk mempermudah akses riwayat order kasir
  @children('orders') orders!: Query<Order>;
}