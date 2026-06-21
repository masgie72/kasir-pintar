import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators'; // Ubah field menjadi text

export default class User extends Model {
  static table = 'users';

  @field('name') name!: string;   // Menggunakan @text lebih aman untuk nama
  @field('email') email!: string; // Menggunakan @text otomatis membersihkan spasi email
  @field('pin') pin!: string;  
  @field('role') role!: string;   // Menggunakan @text untuk string hasil hash
}
