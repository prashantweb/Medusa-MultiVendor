export interface Vendor {
  id: string;
  name: string;
  slug: string;
  stripe_account_id: string;
  commission_rate: number; // e.g. 15 for 15%
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  joinedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  date: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // Dollar amount
  imageUrl: string;
  vendor_id: string; // References Vendor.id
  category: string;
  inventory: number;
  status: 'draft' | 'pending_approval' | 'approved';
  rating: number;
  reviews: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
}

export interface SplitOrder {
  id: string;
  vendor_id: string;
  items: CartItem[];
  subtotal: number;
  commission: number; // commission collected by platform
  payoutAmount: number; // subtotal - commission
  status: 'pending' | 'paid' | 'shipped';
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
  splitOrders: SplitOrder[];
}

export interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  period: string;
  status: 'pending' | 'paid';
  date: string;
}

// Payload CMS Types
export type FontFamilyType = 'sans' | 'serif' | 'mono';

export interface ThemeSection {
  id: string;
  type: 'hero' | 'featured_collections' | 'testimonials' | 'promo_banner' | 'footer';
  enabled: boolean;
  title: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
}

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: FontFamilyType;
  sections: ThemeSection[];
  isActive: boolean;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
}
