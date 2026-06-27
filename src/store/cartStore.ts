import { create } from 'zustand';

// Interface tunggal untuk memastikan konsistensi tipe data di seluruh aplikasi
export interface CartItem {
  productId: string; // Selalu string (UUID/Stringified ID)
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  // Getters untuk efisiensi render di komponen
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (newItem) => set((state) => {
    const existingIndex = state.items.findIndex(
      (item) => item.productId === newItem.productId
    );

    if (existingIndex > -1) {
      const updatedItems = [...state.items];
      updatedItems[existingIndex].quantity += newItem.quantity;
      return { items: updatedItems };
    }
    return { items: [...state.items, newItem] };
  }),

  removeItem: (productId) => set((state) => {
    const existingItem = state.items.find(item => item.productId === productId);
    
    if (!existingItem) return state;

    if (existingItem.quantity > 1) {
      const updatedItems = state.items.map(item =>
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
      return { items: updatedItems };
    } else {
      const filteredItems = state.items.filter(item => item.productId !== productId);
      return { items: filteredItems };
    }
  }),

  clearCart: () => set({ items: [] }),

  // Menggunakan getter agar UI tidak perlu melakukan reduce berulang kali
  getTotalPrice: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));