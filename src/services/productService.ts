import { database } from '../database';
import Category from '../database/models/Category';

export const getCategories = async () => {
  const categories = await database.get<Category>('categories').query().observe().subscribe({
    next: (data) => data,
    error: () => [],
  });
  return categories;
};

export const addProduct = async (name: string, price: number, costPrice: number, stock: number, categoryId?: string) => {
  if (price < 0 || stock < 0 || costPrice < 0) {
    throw new Error('Harga, Modal, dan Stok tidak boleh negatif');
  }

  await database.write(async () => {
    await database.get('products').create((product: any) => {
      product.name = name;
      product.price = price;
      product.costPrice = costPrice;
      product.stock = stock;
      product.isActive = true;
      product.deviceId = 'local';
      product.updatedAt = new Date();
      product.isSynced = false;
      product.categoryId = categoryId || '';
    });
  });
};

export const deleteProduct = async (product: any) => {
  if (!product) return;
  
  await database.write(async () => {
    await product.destroyPermanently();
  });
};

export const addCategory = async (name: string, description: string) => {
  await database.write(async () => {
    await database.get<Category>('categories').create((category: any) => {
      category.name = name;
      category.description = description;
      category.deviceId = 'local';
      category.updatedAt = new Date();
      category.isSynced = false;
    });
  });
};
