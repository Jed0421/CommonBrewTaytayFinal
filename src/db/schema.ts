import { pgTable, text, serial, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table (supporting both staff users and customers, with Firebase Auth uid)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  fullName: text('full_name').notNull(),
  username: text('username').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull().default('Customer'), // 'Administrator' | 'Cashier' | 'Customer'
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  isPhoneVerified: boolean('is_phone_verified').default(false),
  isEmailVerified: boolean('is_email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Inventory (Raw Materials) table
export const inventory = pgTable('inventory', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  currentStock: doublePrecision('current_stock').notNull().default(0),
  criticalLevel: doublePrecision('critical_level').notNull().default(10),
  category: text('category').default('General'),
  unitCost: doublePrecision('unit_cost').default(0),
  supplierName: text('supplier_name').default('Local Supplier'),
  isArchived: boolean('is_archived').default(false),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Inventory Logs
export const inventoryLogs = pgTable('inventory_logs', {
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventory.id),
  changeType: text('change_type').notNull(), // 'stock_in' | 'stock_out' | 'spoilage' | 'set' | 'deduction'
  quantityChange: doublePrecision('quantity_change').notNull(),
  note: text('note'),
  performedBy: text('performed_by').notNull().default('System'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  price: doublePrecision('price').notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').notNull().default(true),
  productType: text('product_type').notNull().default('Drink'), // 'Drink' | 'Food'
  upsizePrice: doublePrecision('upsize_price'),
  description: text('description'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Product Recipes (Regular 16oz or Base)
export const productRecipes = pgTable('product_recipes', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventory.id),
  quantity: doublePrecision('quantity').notNull()
});

// Product Upsize Recipes (22oz)
export const productUpsizeRecipes = pgTable('product_upsize_recipes', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  inventoryItemId: text('inventory_item_id').notNull().references(() => inventory.id),
  quantity: doublePrecision('quantity').notNull()
});

// POS Transactions
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  transactionRef: text('transaction_ref').notNull().unique(),
  cashierId: text('cashier_id'),
  cashierName: text('cashier_name'),
  paymentMethod: text('payment_method').notNull().default('Cash'),
  subtotal: doublePrecision('subtotal').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull().default(0),
  cashTendered: doublePrecision('cash_tendered'),
  changeAmount: doublePrecision('change_amount'),
  status: text('status').notNull().default('completed'), // 'completed' | 'void'
  voidedAt: timestamp('voided_at'),
  voidReason: text('void_reason'),
  voidedBy: text('voided_by'),
  items: jsonb('items').notNull().$type<any[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Online Orders
export const onlineOrders = pgTable('online_orders', {
  id: text('id').primaryKey(),
  orderRef: text('order_ref').notNull().unique(),
  customerId: text('customer_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  deliveryEmailSent: boolean('delivery_email_sent').default(false),
  deliveryEmailRecipient: text('delivery_email_recipient'),
  deliveryEmailSentAt: timestamp('delivery_email_sent_at'),
  inventoryDeducted: boolean('inventory_deducted').default(false),
  orderType: text('order_type').notNull().default('Pickup'), // 'Pickup' | 'Delivery' | 'DineIn'
  deliveryAddress: text('delivery_address'),
  tableNumber: text('table_number'),
  paymentMethod: text('payment_method').notNull(),
  gcashAccount: text('gcash_account'),
  gcashReferenceNumber: text('gcash_reference_number'),
  gcashReceiptImage: text('gcash_receipt_image'),
  items: jsonb('items').notNull().$type<any[]>(),
  subtotal: doublePrecision('subtotal').notNull(),
  deliveryFee: doublePrecision('delivery_fee').notNull().default(0),
  loyaltyDiscount: doublePrecision('loyalty_discount').default(0),
  loyaltyPointsRedeemed: integer('loyalty_points_redeemed').default(0),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Store Settings
export const storeSettings = pgTable('store_settings', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  aboutText: text('about_text'),
  address: text('address'),
  hours: text('hours'),
  phone: text('phone'),
  email: text('email'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
