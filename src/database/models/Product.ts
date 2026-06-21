import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, children } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import OrderItem from './OrderItem'

export default class Product extends Model {
  static table = 'products'
  static associations: Associations = {
    order_items: { type: 'has_many', foreignKey: 'product_id' },
  } as const

  @field('name') name!: string
  @field('barcode') barcode!: string
  @field('price') price!: number
  @field('stock') stock!: number
  @field('is_active') isActive!: boolean
  @date('updated_at') updatedAt!: Date
  @field('is_synced') isSynced!: boolean

  @children('order_items') orderItems!: Relation<OrderItem>
}
