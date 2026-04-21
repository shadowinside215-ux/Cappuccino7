export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  points: number;
  coffeeCount: number; // Keep for legacy or general coffee tracking
  itemLoyalty: Record<string, number>; // productId -> count mapping
  isAdmin: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  isAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  pointsEarned: number;
  createdAt: any; // Firestore Timestamp
}

export interface AppSettings {
  pointsRate: number;
  rewardThreshold: number;
}
