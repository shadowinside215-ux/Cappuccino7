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
  isKitchen?: boolean;
  isBarman?: boolean;
  isDriver?: boolean;
  isCashier?: boolean;
  isAnonymous?: boolean;
  createdAt: string;
}

export type WaiterOrderStatus = 'New' | 'Accepted' | 'Preparing' | 'Ready' | 'Served';

export interface WaiterRequest {
  id: string;
  clientId: string;
  orderId?: string;
  clientName: string;
  tableZone: 'A' | 'B';
  tableArea: 'Inside' | 'Outside';
  tableNumber: string;
  fullTableLabel: string;
  timestamp: any;
  status: 'new' | 'accepted' | 'completed';
  waiterId: string | null;
  waiterName: string | null;
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
  image?: string;
  customization?: string;
  system?: 'kitchen' | 'barman' | 'both';
  categoryName?: string;
  subSection?: string;
  isComboPart?: boolean;
  comboType?: 'food' | 'drink';
  pointsWorth?: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  kitchenStatus?: 'pending' | 'preparing' | 'ready' | 'completed';
  barmanStatus?: 'pending' | 'preparing' | 'ready' | 'completed';
  isPaid?: boolean;
  isPOS?: boolean;
  paymentMethod?: 'cash' | 'card' | 'online' | 'PROVISOIRE';
  vendeur?: string;
  deliveryType: 'delivery' | 'pickup' | 'dine-in' | 'takeaway';
  prepTime: number; // in minutes
  estimatedReadyAt?: any; // legacy field
  expectedReadyAt?: any; // Firestore Timestamp
  preparingAt?: any; // Firestore Timestamp
  readyAt?: any; // Firestore Timestamp
  readyInMinutes?: number;
  deliveredAt?: any; // Firestore Timestamp
  deliveredInMinutes?: number;
  address: string;
  deliveryNotes?: string;
  tableZone?: 'A' | 'B';
  tableArea?: 'Inside' | 'Outside';
  tableNumber?: string;
  fullTableLabel?: string;
  waiterId?: string | null;
  waiterName?: string | null;
  waiterStatus?: WaiterOrderStatus;
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
