export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  originalPrice: number;
  price: number;
  rating: number;
  conditionGrade: "LIKE_NEW" | "EXCELLENT" | "VERY_GOOD" | "FAIR";
  stock: number;
  description: string;
  specifications: Record<string, string>;
  refurbishedDetails: string;
  imageUrl: string;
  isFeatured?: boolean;
  aiRecommendationReason?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface TrackingStep {
  status: string;
  date: string;
  done: boolean;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  address: string;
  items: OrderItem[];
  tracking: TrackingStep[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  date: string;
}

export interface Review {
  id: number;
  productId: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface DeveloperFile {
  name: string;
  content: string;
}
