export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  points: number;
  coffeeCount: number;
  itemLoyalty: Record<string, number>;
  isAdmin: boolean;
  isWaiter?: boolean;
  isDriver?: boolean;
  isAnonymous?: boolean;
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
  subSection?: string;
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
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  deliveryType: 'delivery' | 'pickup' | 'dine-in';
  prepTime: number; // in minutes
  estimatedReadyAt?: any; // Firestore Timestamp
  preparingAt?: any; // Firestore Timestamp
  readyAt?: any; // Firestore Timestamp
  deliveredAt?: any; // Firestore Timestamp
  deliveredInMinutes?: number;
  address: string;
  deliveryNotes?: string;
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
