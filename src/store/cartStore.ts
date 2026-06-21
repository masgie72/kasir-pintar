import { create } from 'zustand';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void; 
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  
  addItem: (newItem) => set((state) => {
    const existingItemIndex = state.items.findIndex(item => item.productId === newItem.productId);
    if (existingItemIndex > -1) {
      const updatedItems = state.items.map((item, index) => 
        index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
      return { items: updatedItems };
    }
    return { items: [...state.items, newItem] };
  }),

  // 💡 SOLUSI UTAMA: Fungsi mengurangi Qty atau menghapus item jika sisa 1
  removeItem: (productId) => set((state) => {
    const existingItem = state.items.find(item => item.productId === productId);
    
    if (!existingItem) return {};

    if (existingItem.quantity > 1) {
      // Jika jumlah lebih dari 1, kurangi 1 angka (Dinamis)
      const updatedItems = state.items.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
      return { items: updatedItems };
    } else {
      // Jika jumlah tinggal 1, buang item tersebut sepenuhnya dari daftar keranjang
      const filteredItems = state.items.filter(item => item.productId !== productId);
      return { items: filteredItems };
    }
  }),

  clearCart: () => set({ items: [] }),
}));
