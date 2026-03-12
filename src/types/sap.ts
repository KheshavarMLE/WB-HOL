export interface PackagingInfo {
  unit: 'pcs' | 'box' | 'pallet' | 'carton' | 'each';
  quantity: number;
  dimensions?: string; // "L x W x H"
  weight?: number; // in kg
}

export interface BOMComponent {
  id: string;
  component: string;
  quantity: number;
  unit: string;
  material?: string;
}

export interface SAPItem {
  itemId: string; // SAP item number
  itemNumber: string; // Display number
  name: string;
  description: string;
  packaging: PackagingInfo;
  billOfMaterials: BOMComponent[];
  specifications: {
    id: string;
    name: string;
    value: string;
  }[];
  primaryImage?: string;
  createdAt: string;
  lastModified: string;
  createdBy?: {
    userId: string;
    username: string;
    color: string;
    timestamp: number;
  };
}

export const generateSAPItemId = (): string => {
  return `SAP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const createDefaultSAPItem = (): SAPItem => ({
  itemId: generateSAPItemId(),
  itemNumber: '',
  name: '',
  description: '',
  packaging: {
    unit: 'pcs',
    quantity: 1,
  },
  billOfMaterials: [],
  specifications: [],
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});
