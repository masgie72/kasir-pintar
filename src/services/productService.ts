
import { database } from '../database';

export const addProduct = async (name: string, price: number, stock: number) => {
  if (price < 0 || stock < 0) {
    throw new Error('Harga dan Stok tidak boleh negatif');
  }

  await database.write(async () => {
    await database.get('products').create((product: any) => {
      product.name = name;
      product.price = price;
      product.stock = stock;
    });
  });
};

export const deleteProduct = async (product: any) => {
  if (!product) return;
  
  await database.write(async () => {
    // Menghapus record secara permanen dari database
    await product.destroyPermanently();
  });
};




