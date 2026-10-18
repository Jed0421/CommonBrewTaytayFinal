export interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  role: 'Administrator' | 'Cashier' | 'Customer';
  isActive: boolean;
  createdAt?: string;
  address?: string;
  loyaltyPoints?: number;
}

export interface Customer {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export type MaterialCategory = string;

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  criticalLevel: number;
  category?: MaterialCategory;
  unitCost?: number;
  supplierName?: string;
  updatedAt?: string;
  isLowStock?: boolean;
  statusLabel?: string;
  stockPercent?: number;
}

export interface ProductRecipe {
  id?: string;
  productId?: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  quantity: number;
  unit?: string;
}

export type CustomerRecord = Customer;
export type CategoryRecord = Category;
export type InventoryRecord = InventoryItem;
export type ProductRecipeRecord = ProductRecipe;

export interface Product {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  productType: 'Drink' | 'Food';
  upsizePrice?: number | null;
  description?: string;
  isArchived?: boolean;
  createdAt?: string;
  recipes?: ProductRecipe[];
  upsizeRecipes?: ProductRecipe[];
  isOutOfStock?: boolean;
  isBaseOutOfStock?: boolean;
  isUpsizeOutOfStock?: boolean;
  outOfStockReason?: string;
  outOfStockIngredients?: string[];
  depletedIngredients?: Array<{
    inventoryItemId: string;
    name: string;
    currentStock: number;
    unit: string;
    requiredQuantity: number;
  }>;
}

export type ProductRecord = Product;

export interface TransactionItem {
  id?: string;
  transactionId?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isUpsize?: boolean;
  addons?: string[];
  notes?: string;
}

export interface Transaction {
  id: string;
  transactionRef: string;
  cashierId?: string;
  cashierName?: string;
  paymentMethod: string;
  subtotal: number;
  totalAmount: number;
  cashTendered?: number | null;
  changeAmount?: number | null;
  status: string;
  voidedAt?: string;
  voidReason?: string;
  voidedBy?: string;
  createdAt: string;
  items: TransactionItem[];
}

export interface OnlineOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isUpsize?: boolean;
  sugarLevel?: string;
  iceLevel?: string;
  addons?: string[];
  specialInstructions?: string;
}

export type OnlineOrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type OrderType = 'Pickup' | 'Delivery' | 'DineIn';

export interface OnlineOrder {
  id: string;
  orderRef: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryEmailSent?: boolean;
  deliveryEmailRecipient?: string;
  deliveryEmailSentAt?: string;
  inventoryDeducted?: boolean;
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: string;
  paymentMethod: 'GCash' | 'Cash on Pickup' | 'Cash on Delivery';
  gcashAccount?: string;
  gcashReferenceNumber?: string;
  gcashReceiptImage?: string;
  cancelReason?: string;
  cancelledAt?: string;
  items: OnlineOrderItem[];
  subtotal: number;
  deliveryFee: number;
  loyaltyDiscount?: number;
  loyaltyPointsRedeemed?: number;
  totalAmount: number;
  status: OnlineOrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreInfo {
  name: string;
  tagline: string;
  aboutText: string;
  address: string;
  hours: string;
  phone: string;
  email: string;
  mapsUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export interface WeeklySalesPoint {
  dayLabel: string;
  revenue: number;
}

export interface ProductSalesSummary {
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DailyAnalytics {
  todayRevenue: number;
  revenueGrowth: number;
  todayTransactions: number;
  transactionGrowth: number;
  topSellingProduct: string;
  lowStockCount: number;
  weeklySales: WeeklySalesPoint[];
  lowStockItems: InventoryItem[];
  topProducts: ProductSalesSummary[];
}

export interface OrderItem {
  id: string;
  productId?: string;
  categoryId?: string | null;
  name: string;
  originalPrice: number;
  upsizePrice?: number | null;
  productType: 'Drink' | 'Food';
  isUpsize: boolean;
  addons: string[];
  sugarLevel?: string;
  iceLevel?: string;
  specialInstructions?: string;
  qty: number;
}

