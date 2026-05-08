import { create } from 'zustand';

export interface CartItem {
  produk_id: number;
  nama: string;
  harga: number;
  qty: number;
  stok: number; // for validation
  kelola_stok: boolean;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  pelanggan_id: number | null;
  
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  updateQty: (produk_id: number, qty: number) => void;
  removeItem: (produk_id: number) => void;
  setPelanggan: (id: number | null) => void;
  clearCart: () => void;
  
  // Computed (accessed via store.getState() or hooks)
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  pelanggan_id: null,
  
  addItem: (newItem) => {
    set((state) => {
      const existingItem = state.items.find(i => i.produk_id === newItem.produk_id);
      if (existingItem) {
        // Validation for stock can be handled in UI before calling this
        const newQty = existingItem.qty + newItem.qty;
        return {
          items: state.items.map(i => 
            i.produk_id === newItem.produk_id 
              ? { ...i, qty: newQty, subtotal: newQty * i.harga }
              : i
          )
        };
      } else {
        return {
          items: [...state.items, { ...newItem, subtotal: newItem.qty * newItem.harga }]
        };
      }
    });
  },
  
  updateQty: (produk_id, qty) => {
    set((state) => ({
      items: state.items.map(i => 
        i.produk_id === produk_id ? { ...i, qty, subtotal: qty * i.harga } : i
      )
    }));
  },
  
  removeItem: (produk_id) => {
    set((state) => ({
      items: state.items.filter(i => i.produk_id !== produk_id)
    }));
  },
  
  setPelanggan: (id) => set({ pelanggan_id: id }),
  
  clearCart: () => set({ items: [], pelanggan_id: null }),
  
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}));
