import { create } from 'zustand';
import { CartItem } from './types';

interface CartStore {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (gameId: number, quantity: number) => void;
  removeItem: (gameId: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  setItems: (items) => set({ items }),
  
  addItem: (item) => set((state) => {
    const existingItem = state.items.find(i => i.gameId === item.gameId);
    if (existingItem) {
      return {
        items: state.items.map(i => 
          i.gameId === item.gameId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    } else {
      return { items: [...state.items, item] };
    }
  }),
  
  updateQuantity: (gameId, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.gameId === gameId ? { ...item, quantity } : item
    )
  })),
  
  removeItem: (gameId) => set((state) => ({
    items: state.items.filter(item => item.gameId !== gameId)
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getTotalPrice: () => {
    const { items } = get();
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    
    // Base price per card (in cents)
    const basePrice = 1200; // $12.00
    
    // Calculate total price without any discounts
    const regularPrice = items.reduce((total, item) => total + (item.game.price * item.quantity), 0);
    
    // If no discount applies
    if (totalItems < 3) {
      return regularPrice;
    }
    
    // Calculate discount based on tiers
    let discountedPrice = 0;
    let remainingItems = totalItems;
    
    // 10% discount for every 3 items
    const tier3 = Math.floor(remainingItems / 3);
    if (tier3 > 0) {
      discountedPrice += (basePrice * 3 * 0.9) * tier3;
      remainingItems -= tier3 * 3;
    }
    
    // 15% discount for every 5 items (after accounting for 3-item tiers)
    const tier5 = Math.floor(remainingItems / 5);
    if (tier5 > 0) {
      discountedPrice += (basePrice * 5 * 0.85) * tier5;
      remainingItems -= tier5 * 5;
    }
    
    // 20% discount for every 10 items (after accounting for 3 and 5-item tiers)
    const tier10 = Math.floor(remainingItems / 10);
    if (tier10 > 0) {
      discountedPrice += (basePrice * 10 * 0.8) * tier10;
      remainingItems -= tier10 * 10;
    }
    
    // Add remaining items at full price
    discountedPrice += remainingItems * basePrice;
    
    // Round to nearest cent to avoid floating point issues
    return Math.round(discountedPrice);
  },
}));
