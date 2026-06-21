import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, relation } from '@nozbe/watermelondb/decorators'
import { Associations } from '@nozbe/watermelondb/Model'
import Order from './Order'
import Product from './Product'

export default class OrderItem extends Model {
  static table = 'order_items'
  static associations: Associations = {
    orders: { type: 'belongs_to', key: 'order_id' },
    products: { type: 'belongs_to', key: 'product_id' },
  } as const

  @field('order_id') orderId!: string
  @field('product_id') productId!: string
  @field('name') name!: string
  @field('price') price!: number
  @field('quantity') quantity!: number
  @date('updated_at') updatedAt!: Date
  @field('is_synced') isSynced!: boolean

  @relation('orders', 'order_id') order!: Relation<Order>
  @relation('products', 'product_id') product!: Relation<Product>
}
