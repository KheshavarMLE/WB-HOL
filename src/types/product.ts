export interface Specification {
  id: string;
  name: string;
  value: string;
}

export type ProductCategory = 
  | 'Power Tools'
  | 'Hand Tools'
  | 'Fastening Systems'
  | 'Measuring Tools'
  | 'Safety Equipment'
  | 'Accessories'
  | 'Other';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Power Tools',
  'Hand Tools',
  'Fastening Systems',
  'Measuring Tools',
  'Safety Equipment',
  'Accessories',
  'Other',
];

// User colors for collaboration
export const USER_COLORS = [
  '#FF5733', // Red-Orange
  '#33C3FF', // Sky Blue
  '#A833FF', // Purple
  '#33FF57', // Green
  '#FFD433', // Yellow
  '#FF33A8', // Pink
  '#33FFF5', // Cyan
  '#FF8C33', // Orange
] as const;

export interface UserInfo {
  userId: string;
  username: string;
  color: string;
  timestamp: number;
}

export interface ActiveUser {
  userId: string;
  username: string;
  color: string;
  lastActive: number;
  isOnline: boolean;
}

export interface ProductData {
  productId: string;
  name: string;
  sku: string;
  category: ProductCategory | '';
  price: string;
  stock: string;
  description: string;
  primaryImage: string;
  additionalImages: string[];
  specifications: Specification[];
  createdAt: string;
  lastModified: string;
  // Phase 3: User attribution
  createdBy?: UserInfo;
  lastModifiedBy?: UserInfo;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: string;
  quantity: number;
  thumbnail: string;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  lastUpdated: string;
}

export interface SessionSettings {
  theme: 'hilti';
  currency: 'USD';
  collaborationEnabled: boolean;
}

export interface SessionData {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  products: ProductData[];
  cart: CartData;
  activeUsers: ActiveUser[];
  settings: SessionSettings;
}

export const generateProductId = (): string => {
  return `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const createDefaultProduct = (): ProductData => ({
  productId: generateProductId(),
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '',
  description: '',
  primaryImage: '',
  additionalImages: [],
  specifications: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

export const createDefaultCart = (): CartData => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  lastUpdated: new Date().toISOString(),
});

export const createDefaultSession = (sessionId: string): SessionData => ({
  sessionId,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  products: [],
  cart: createDefaultCart(),
  activeUsers: [],
  settings: {
    theme: 'hilti',
    currency: 'USD',
    collaborationEnabled: true,
  },
});

// Legacy compatibility - map old single product to new format
export const defaultProductData: ProductData = createDefaultProduct();
