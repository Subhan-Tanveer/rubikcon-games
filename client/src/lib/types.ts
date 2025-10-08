export interface Game {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number; // in kobo
  category: string;
  image: string;
  images: string[];
  isOnline: number;
  createdAt: Date;
}

export interface CartItem {
  id: number;
  sessionId: string;
  gameId: number;
  quantity: number;
  game: Game;
  createdAt: Date;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
}

export interface Order {
  id: number;
  sessionId: string;
  customerInfo: CustomerInfo;
  items: Array<{
    gameId: number;
    title: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  createdAt: Date;
}

// Helper function to format price in Dollars
export const formatPrice = (priceInCents: number): string => {
  return `$${(priceInCents / 100).toFixed(2)}`;
};
