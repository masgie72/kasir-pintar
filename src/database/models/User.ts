import { Model, Query } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Order from './Order'

export default class User extends Model {
  static table = 'users'
  
  static associations: Associations = {
    orders: { type: 'has_many', foreignKey: 'user_id' },
  } as const

  @field('name') name!: string
  @field('email') email!: string
  @field('pin_hash') pinHash!: string  // 👑 KUNCI UTAMA: Wajib camelCase 'pinHash'
  @field('role') role!: string
  @field('is_active') isActive!: boolean // 👑 Kembalikan ke camelCase 'isActive'
  @date('updated_at') updatedAt!: Date   // 👑 Kembalikan ke camelCase 'updatedAt'
  @field('is_synced') isSynced!: boolean // 👑 Kembalikan ke camelCase 'isSynced'

  @children('orders') orders!: Query<Order>
}
