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
  'Power Tools', 'Hand Tools', 'Fastening Systems',
  'Measuring Tools', 'Safety Equipment', 'Accessories', 'Other',
];

export const USER_COLORS = [
  '#FF5733', '#33C3FF', '#A833FF', '#33FF57',
  '#FFD433', '#FF33A8', '#33FFF5', '#FF8C33',
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

// ── SAP ──────────────────────────────────────────────────────────────────────

export interface BOMComponent {
  id: string;
  component: string;
  quantity: number;
  unit: string;
}

export interface SAPItem {
  itemId: string;
  itemNumber: string;
  name: string;
  description: string;
  packaging: {
    unit: string;
    quantity: number;
    dimensions?: string;
    weight?: number;
  };
  billOfMaterials: BOMComponent[];
  specifications: Specification[];
  primaryImage?: string;
  createdAt: string;
  lastModified: string;
}

export const generateSAPItemId = (): string =>
  `SAP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const createDefaultSAPItem = (): SAPItem => ({
  itemId: generateSAPItemId(),
  itemNumber: '',
  name: '',
  description: '',
  packaging: { unit: 'pcs', quantity: 1 },
  billOfMaterials: [],
  specifications: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

// ── Range ─────────────────────────────────────────────────────────────────────

export interface Range {
  rangeId: string;
  name: string;
  description?: string;
  sapItemIds: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  lastModified: string;
}

export const generateRangeId = (): string =>
  `range_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

export const createDefaultRange = (name: string = ''): Range => ({
  rangeId: generateRangeId(),
  name,
  sapItemIds: [],
  isPublished: false,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

// ── Session ───────────────────────────────────────────────────────────────────

export interface SessionData {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  products: ProductData[];
  cart: CartData;
  activeUsers: ActiveUser[];
  settings: SessionSettings;
  sapItems: SAPItem[];
  ranges: Range[];
}

export const generateProductId = (): string =>
  `p_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

export const generateUserId = (): string =>
  `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const createDefaultProduct = (): ProductData => ({
  productId: generateProductId(),
  name: '', sku: '', category: '', price: '', stock: '',
  description: '', primaryImage: '', additionalImages: [], specifications: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

export const createDefaultCart = (): CartData => ({
  items: [], subtotal: 0, itemCount: 0,
  lastUpdated: new Date().toISOString(),
});

export const createDefaultSession = (sessionId: string): SessionData => ({
  sessionId,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  products: [],
  cart: createDefaultCart(),
  activeUsers: [],
  settings: { theme: 'hilti', currency: 'USD', collaborationEnabled: true },
  sapItems: [],
  ranges: [],
});

export const defaultProductData: ProductData = createDefaultProduct();
