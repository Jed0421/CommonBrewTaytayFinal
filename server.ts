import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import {
  commonbrewCategories,
  commonbrewInventory,
  commonbrewProducts,
  commonbrewProductRecipes,
  commonbrewProductUpsizeRecipes
} from './src/data/commonbrewData.ts';
import { syncCloudSqlDatabase, syncTransactionToCloudSql, syncOnlineOrderToCloudSql, syncInventoryUpdateToCloudSql } from './src/db/sync.ts';
import {
  hydrateFromSupabase,
  migrateDataToSupabase,
  setupSupabaseRealtime,
  startContinuousSupabaseSync,
  syncUserToSupabase,
  syncCustomerToSupabase,
  syncPasswordToSupabase,
  syncProductToSupabase,
  syncProductAvailabilityToSupabase,
  syncTransactionToSupabase,
  syncVoidTransactionToSupabase,
  syncOnlineOrderToSupabase,
  syncInventoryUpdateToSupabase,
  syncInventoryLogToSupabase,
  syncStoreSettingsToSupabase
} from './src/db/supabaseSync.ts';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : (typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.disable('x-powered-by');
// Behind Cloud Run / a reverse proxy: trust the first hop so req.ip is the real client IP
app.set('trust proxy', 1);

// Basic security headers on every response
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Simple in-memory rate limiter (per client IP + optional target such as the email/username,
// so customers sharing the store Wi-Fi don't block each other)
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(name: string, max: number, windowMs: number, targetOf?: (req: express.Request) => string): express.RequestHandler {
  return (req, res, next) => {
    const target = targetOf ? String(targetOf(req) || '').trim().toLowerCase() : '';
    const key = `${name}:${req.ip}:${target}`;
    const now = Date.now();
    let bucket = rateLimitBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateLimitBuckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Please wait ${Math.ceil(retryAfterSec / 60)} minute(s) and try again.`
      });
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

const loginTarget = (req: express.Request) => req.body?.identifier || req.body?.username || req.body?.email || '';
const otpTarget = (req: express.Request) => req.body?.email || req.body?.phone || '';
const loginLimiter = rateLimit('login', 20, 15 * 60 * 1000, loginTarget);
const otpSendLimiter = rateLimit('otp-send', 8, 15 * 60 * 1000, otpTarget);
const otpVerifyLimiter = rateLimit('otp-verify', 10, 15 * 60 * 1000, otpTarget);
const chatbotLimiter = rateLimit('chatbot', 30, 60 * 1000);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ── In-Memory Database Seed Data ────────────────────────────
interface UserRecord {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: 'Administrator' | 'Cashier';
  isActive: boolean;
  createdAt: string;
}

interface CategoryRecord {
  id: string;
  name: string;
}

interface InventoryRecord {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  criticalLevel: number;
  category?: string;
  unitCost?: number;
  supplierName?: string;
  isArchived?: boolean;
  updatedAt?: string;
}

interface CustomerRecord {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  passwordHash: string;
  address?: string;
  loyaltyPoints: number;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
}

interface OnlineOrderItemRecord {
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

interface OnlineOrderRecord {
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
  orderType: 'Pickup' | 'Delivery' | 'DineIn';
  deliveryAddress?: string;
  tableNumber?: string;
  paymentMethod: 'GCash' | 'Cash on Pickup' | 'Cash on Delivery' | 'Card';
  gcashAccount?: string;
  gcashReferenceNumber?: string;
  gcashReceiptImage?: string;
  cancelReason?: string;
  cancelledAt?: string;
  items: OnlineOrderItemRecord[];
  subtotal: number;
  deliveryFee: number;
  loyaltyDiscount?: number;
  loyaltyPointsRedeemed?: number;
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProductRecipeRecord {
  id?: string;
  productId?: string;
  inventoryItemId: string;
  quantity: number;
}

interface ProductRecord {
  id: string;
  name: string;
  categoryId: string | null;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  productType: 'Drink' | 'Food';
  upsizePrice?: number | null;
  isArchived?: boolean;
  createdAt?: string;
}

interface TransactionItemRecord {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isUpsize?: boolean;
  addons?: string[];
}

interface TransactionRecord {
  id: string;
  transactionRef: string;
  cashierId: string;
  cashierName: string;
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
  items: TransactionItemRecord[];
}

interface InventoryLogRecord {
  id: string;
  inventoryItemId: string;
  changeType: string;
  quantityChange: number;
  note?: string;
  transactionId?: string;
  performedBy?: string;
  createdAt: string;
}

// Initial Users
const users: UserRecord[] = [
  {
    id: 'u-1',
    fullName: 'Manager Admin',
    username: 'admin',
    email: 'admin@commonbrew.ph',
    phone: '09171234567',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'Administrator',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u-2',
    fullName: 'Maria Cashier',
    username: 'cashier',
    email: 'cashier@commonbrew.ph',
    phone: '09181234567',
    passwordHash: bcrypt.hashSync('cashier123', 10),
    role: 'Cashier',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Initial Categories
const categories: CategoryRecord[] = commonbrewCategories;

// Initial Inventory Items (Raw Materials & Packaging)
const inventory: InventoryRecord[] = commonbrewInventory;

// Initial Customers
const customers: CustomerRecord[] = [
  {
    id: 'cust-jedi-01',
    fullName: 'Jedidiah Galicia',
    username: 'Jedi',
    email: 'jedidiah0421@gmail.com',
    phone: '+639474960778',
    passwordHash: bcrypt.hashSync('JDG_0421', 10),
    address: '#36 Dalandanan Street , Phase 3 BRGY. San Roque',
    loyaltyPoints: 105,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'cust-maria-02',
    fullName: 'Maria Santos',
    username: 'maria_s',
    email: 'maria.santos@gmail.com',
    phone: '+639181234567',
    passwordHash: bcrypt.hashSync('maria123', 10),
    address: 'Block 4 Lot 9, Highway Hills, Taytay, Rizal',
    loyaltyPoints: 75,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2026-08-05T09:15:00.000Z'
  }
];

// Store Information
const storeInfo = {
  name: 'CommonBrew Taytay',
  tagline: 'Crafted Coffee & Everyday Comforts in Taytay, Rizal',
  aboutText: 'Welcome to CommonBrew Taytay! Born out of passion for artisanal specialty coffee, fresh locally sourced dairy, and comforting warm drink series.',
  address: 'Unit 7 Leoncio Commercial Building National Road, Sitio Ilog Pugad, San Juan, Taytay, 1920 Rizal',
  hours: 'Monday to Sunday: 11:00 AM - 9:00 PM',
  phone: '09176781989',
  email: 'hello@commonbrewtaytay.com',
  mapsUrl: 'https://maps.app.goo.gl/JAGTV9hGCi2FM9TDA',
  facebookUrl: 'https://facebook.com/commonbrewtaytay',
  instagramUrl: 'https://instagram.com/commonbrewtaytay'
};

// Initial Online Orders (clean empty array for genuine customer and POS orders)
const onlineOrders: OnlineOrderRecord[] = [];

// Initial Products
const products: ProductRecord[] = commonbrewProducts;

// Recipes mapping (product -> inventory item -> qty)
const productRecipes: ProductRecipeRecord[] = [...commonbrewProductRecipes];
const productUpsizeRecipes: ProductRecipeRecord[] = [...commonbrewProductUpsizeRecipes];

// Automatically ensure Straw (inv-55) is in recipes for all cold drinks (both regular and upsize)
products.forEach(p => {
  if (p.productType === 'Drink' && p.categoryId !== 'cat-hotcoffee') {
    // Regular recipe: Ensure Straw
    if (!productRecipes.some(r => r.productId === p.id && r.inventoryItemId === 'inv-55')) {
      productRecipes.push({
        id: `rec-straw-${p.id}`,
        productId: p.id,
        inventoryItemId: 'inv-55',
        quantity: 1
      });
    }
    // Upsize recipe: Ensure Straw
    if (!productUpsizeRecipes.some(r => r.productId === p.id && r.inventoryItemId === 'inv-55')) {
      productUpsizeRecipes.push({
        id: `uprec-straw-${p.id}`,
        productId: p.id,
        inventoryItemId: 'inv-55',
        quantity: 1
      });
    }
  }
});

// Add-on inventory resolution helper
interface AddonResolution {
  invItem: InventoryRecord;
  quantityPerDrink: number;
  addonLabel: string;
}

function resolveAddonInventory(addonName: string): AddonResolution | null {
  const clean = addonName.trim().toLowerCase();
  if (!clean) return null;

  // 1. Nata De Coco (1 scoop)
  if (clean.includes('nata')) {
    const invItem = inventory.find(i => i.id === 'inv-12') ||
                    inventory.find(i => i.name.toLowerCase().includes('nata'));
    if (invItem) {
      return { invItem, quantityPerDrink: 1, addonLabel: 'Nata De Coco' };
    }
  }

  // 2. Tapioca Pearls (1 scoop)
  if (clean.includes('pearl') || clean.includes('boba') || clean.includes('tapioca')) {
    const invItem = inventory.find(i => i.id === 'inv-9') ||
                    inventory.find(i => i.name.toLowerCase().includes('pearl') || i.name.toLowerCase().includes('tapioca'));
    if (invItem) {
      return { invItem, quantityPerDrink: 1, addonLabel: 'Tapioca Pearls' };
    }
  }

  // 3. Coffee Jelly (1 scoop)
  if (clean.includes('jelly')) {
    const invItem = inventory.find(i => i.id === 'inv-54') ||
                    inventory.find(i => i.name.toLowerCase().includes('jelly'));
    if (invItem) {
      return { invItem, quantityPerDrink: 1, addonLabel: 'Coffee Jelly' };
    }
  }

  // 4. Cream Cheese / Cheese walling (20g)
  if (clean.includes('cheese')) {
    const invItem = inventory.find(i => i.id === 'inv-8') ||
                    inventory.find(i => i.name.toLowerCase().includes('cream cheese'));
    if (invItem) {
      return { invItem, quantityPerDrink: 20, addonLabel: 'Cream Cheese' };
    }
  }

  // 5. Whipped Cream (25g)
  if (clean.includes('whip')) {
    const invItem = inventory.find(i => i.id === 'inv-11') ||
                    inventory.find(i => i.name.toLowerCase().includes('whipped cream'));
    if (invItem) {
      return { invItem, quantityPerDrink: 25, addonLabel: 'Whipped Cream' };
    }
  }

  // 6. Espresso Shot (18cc)
  if (clean.includes('espresso') || clean.includes('shot')) {
    const invItem = inventory.find(i => i.id === 'inv-2') ||
                    inventory.find(i => i.name.toLowerCase().includes('espresso'));
    if (invItem) {
      return { invItem, quantityPerDrink: 18, addonLabel: 'Espresso Shot' };
    }
  }

  // General fallback: match inventory item name directly
  const generalMatch = inventory.find(i =>
    i.name.toLowerCase() === clean ||
    clean.includes(i.name.toLowerCase()) ||
    i.name.toLowerCase().includes(clean)
  );
  if (generalMatch) {
    return { invItem: generalMatch, quantityPerDrink: 1, addonLabel: generalMatch.name };
  }

  return null;
}

// Extract addons from item.addons array AND bracket format in item.productName e.g. "Matcha Latte [Nata de Coco]"
function getItemAddons(item: { productName?: string; addons?: string[] }): string[] {
  const result: string[] = [];

  if (Array.isArray(item.addons)) {
    item.addons.forEach(a => {
      if (typeof a === 'string' && a.trim()) {
        const trimmed = a.trim();
        if (!result.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
          result.push(trimmed);
        }
      }
    });
  }

  if (item.productName && item.productName.includes('[') && item.productName.includes(']')) {
    const startIdx = item.productName.indexOf('[');
    const endIdx = item.productName.lastIndexOf(']');
    if (endIdx > startIdx) {
      const content = item.productName.substring(startIdx + 1, endIdx);
      const parts = content.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        if (!result.some(r => r.toLowerCase() === p.toLowerCase())) {
          result.push(p);
        }
      });
    }
  }

  return result;
}

// Helper to deduct inventory based on order items (including add-ons like Nata De Coco)
function deductInventoryForOrder(
  items: Array<{ productId?: string; productName?: string; quantity: number; isUpsize?: boolean; addons?: string[] }>,
  reference: string,
  performedBy: string
) {
  items.forEach(item => {
    const orderQty = Math.max(1, Number(item.quantity) || 1);

    // 1. Deduct Product Base Recipes
    let targetProd = products.find(p => p.id === item.productId);
    if (!targetProd && item.productName) {
      const cleanName = item.productName.split('(')[0].split('[')[0].trim().toLowerCase();
      targetProd = products.find(p => p.name.toLowerCase() === cleanName || cleanName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(cleanName));
    }

    if (!targetProd && item.productId) {
      targetProd = products.find(p => p.id === item.productId || item.productId?.startsWith(p.id));
    }

    if (targetProd) {
      const pId = targetProd.id;
      const applicableRecipes = item.isUpsize
        ? productUpsizeRecipes.filter(r => r.productId === pId)
        : productRecipes.filter(r => r.productId === pId);

      const recipesToUse = applicableRecipes.length > 0
        ? applicableRecipes
        : productRecipes.filter(r => r.productId === pId);

      recipesToUse.forEach(rec => {
        const invItem = inventory.find(inv => inv.id === rec.inventoryItemId);
        if (invItem) {
          const deductQty = rec.quantity * orderQty;
          invItem.currentStock = Math.max(0, invItem.currentStock - deductQty);
          invItem.updatedAt = new Date().toISOString();

          // Sync stock update to Cloud SQL & Supabase
          syncInventoryUpdateToCloudSql(invItem.id, invItem.currentStock).catch(err => console.error('Cloud SQL stock sync error:', err));
          syncInventoryUpdateToSupabase(invItem.id, invItem.currentStock).catch(err => console.error('Supabase stock sync error:', err));

          const logEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            inventoryItemId: invItem.id,
            changeType: 'deduction',
            quantityChange: -deductQty,
            note: `Order ${reference}: ${targetProd?.name || item.productName || 'Item'} x${orderQty}`,
            performedBy: performedBy || 'System',
            createdAt: new Date().toISOString()
          };
          inventoryLogs.push(logEntry);
          syncInventoryLogToSupabase(logEntry).catch(err => console.error('Supabase log sync error:', err));
        }
      });
    }

    // 2. DEDUCT ADD-ONS (e.g. Nata De Coco, Tapioca Pearls, Coffee Jelly, Cream Cheese, etc.)
    const addons = getItemAddons(item);
    addons.forEach(addonName => {
      const resolved = resolveAddonInventory(addonName);
      if (resolved) {
        const { invItem, quantityPerDrink, addonLabel } = resolved;
        const totalAddonDeduct = quantityPerDrink * orderQty;
        invItem.currentStock = Math.max(0, invItem.currentStock - totalAddonDeduct);
        invItem.updatedAt = new Date().toISOString();

        // Sync stock update to Cloud SQL & Supabase
        syncInventoryUpdateToCloudSql(invItem.id, invItem.currentStock).catch(err => console.error('Cloud SQL addon stock sync error:', err));
        syncInventoryUpdateToSupabase(invItem.id, invItem.currentStock).catch(err => console.error('Supabase addon stock sync error:', err));

        const addonLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          inventoryItemId: invItem.id,
          changeType: 'deduction',
          quantityChange: -totalAddonDeduct,
          note: `Order ${reference} Add-on: ${addonLabel} x${totalAddonDeduct} ${invItem.unit} (for ${item.productName || targetProd?.name || 'Drink'})`,
          performedBy: performedBy || 'System',
          createdAt: new Date().toISOString()
        };
        inventoryLogs.push(addonLogEntry);
        syncInventoryLogToSupabase(addonLogEntry).catch(err => console.error('Supabase addon log sync error:', err));
      }
    });
  });
}

// Helper to restore inventory when an order is voided or cancelled
function restoreInventoryForOrder(
  items: Array<{ productId?: string; productName?: string; quantity: number; isUpsize?: boolean; addons?: string[] }>,
  reference: string,
  performedBy: string
) {
  items.forEach(item => {
    const orderQty = Math.max(1, Number(item.quantity) || 1);

    // 1. Restore Product Base Recipes
    let targetProd = products.find(p => p.id === item.productId);
    if (!targetProd && item.productName) {
      const cleanName = item.productName.split('(')[0].split('[')[0].trim().toLowerCase();
      targetProd = products.find(p => p.name.toLowerCase() === cleanName || cleanName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(cleanName));
    }

    if (!targetProd && item.productId) {
      targetProd = products.find(p => p.id === item.productId || item.productId?.startsWith(p.id));
    }

    if (targetProd) {
      const pId = targetProd.id;
      const applicableRecipes = item.isUpsize
        ? productUpsizeRecipes.filter(r => r.productId === pId)
        : productRecipes.filter(r => r.productId === pId);

      const recipesToUse = applicableRecipes.length > 0
        ? applicableRecipes
        : productRecipes.filter(r => r.productId === pId);

      recipesToUse.forEach(rec => {
        const invItem = inventory.find(inv => inv.id === rec.inventoryItemId);
        if (invItem) {
          const restoreQty = rec.quantity * orderQty;
          invItem.currentStock += restoreQty;
          invItem.updatedAt = new Date().toISOString();

          // Sync stock restore to Cloud SQL & Supabase
          syncInventoryUpdateToCloudSql(invItem.id, invItem.currentStock).catch(err => console.error('Cloud SQL restore sync error:', err));
          syncInventoryUpdateToSupabase(invItem.id, invItem.currentStock).catch(err => console.error('Supabase restore sync error:', err));

          const restoreLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            inventoryItemId: invItem.id,
            changeType: 'stock_in',
            quantityChange: restoreQty,
            note: `Order Restoration (${reference}): ${targetProd?.name || item.productName || 'Item'} x${orderQty}`,
            performedBy: performedBy || 'System',
            createdAt: new Date().toISOString()
          };
          inventoryLogs.push(restoreLogEntry);
          syncInventoryLogToSupabase(restoreLogEntry).catch(err => console.error('Supabase log sync error:', err));
        }
      });
    }

    // 2. RESTORE ADD-ONS (e.g. Nata De Coco, Tapioca Pearls, Coffee Jelly, Cream Cheese, etc.)
    const addons = getItemAddons(item);
    addons.forEach(addonName => {
      const resolved = resolveAddonInventory(addonName);
      if (resolved) {
        const { invItem, quantityPerDrink, addonLabel } = resolved;
        const totalAddonRestore = quantityPerDrink * orderQty;
        invItem.currentStock += totalAddonRestore;
        invItem.updatedAt = new Date().toISOString();

        // Sync stock restore to Cloud SQL & Supabase
        syncInventoryUpdateToCloudSql(invItem.id, invItem.currentStock).catch(err => console.error('Cloud SQL addon restore sync error:', err));
        syncInventoryUpdateToSupabase(invItem.id, invItem.currentStock).catch(err => console.error('Supabase addon restore sync error:', err));

        const addonRestoreLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          inventoryItemId: invItem.id,
          changeType: 'stock_in',
          quantityChange: totalAddonRestore,
          note: `Order Restoration (${reference}) Add-on: ${addonLabel} x${totalAddonRestore} ${invItem.unit}`,
          performedBy: performedBy || 'System',
          createdAt: new Date().toISOString()
        };
        inventoryLogs.push(addonRestoreLogEntry);
        syncInventoryLogToSupabase(addonRestoreLogEntry).catch(err => console.error('Supabase addon log sync error:', err));
      }
    });
  });
}

// Pre-seeded Transactions
const transactions: TransactionRecord[] = [];
const inventoryLogs: InventoryLogRecord[] = [];

// Generate sample transactions for today and past week
const seedTransactions = () => {
  const now = new Date();
  const sampleProducts = [products[0], products[1], products[3], products[5]];

  for (let i = 6; i >= 0; i--) {
    const txDate = new Date();
    txDate.setDate(now.getDate() - i);
    const count = i === 0 ? 8 : Math.floor(Math.random() * 6) + 4;

    for (let j = 0; j < count; j++) {
      const p = sampleProducts[j % sampleProducts.length];
      const qty = Math.floor(Math.random() * 2) + 1;
      const total = p.price * qty;
      const refNum = `CB-${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}${String(txDate.getDate()).padStart(2, '0')}-${1000 + i * 10 + j}`;

      transactions.push({
        id: `tx-${i}-${j}`,
        transactionRef: refNum,
        cashierId: 'u-2',
        cashierName: 'Maria Cashier',
        paymentMethod: j % 3 === 0 ? 'GCash' : 'Cash',
        subtotal: total,
        totalAmount: total,
        cashTendered: j % 3 === 0 ? total : total + 50,
        changeAmount: j % 3 === 0 ? 0 : 50,
        status: 'completed',
        createdAt: txDate.toISOString(),
        items: [
          {
            id: `txi-${i}-${j}`,
            transactionId: `tx-${i}-${j}`,
            productId: p.id,
            productName: p.name,
            unitPrice: p.price,
            quantity: qty,
            subtotal: total,
            isUpsize: false,
            addons: []
          }
        ]
      });
    }
  }
};
seedTransactions();

// ── Isolated Multi-Device Session Stores ──────────────────────
interface StaffSession {
  token: string;
  userId: string;
  createdAt: number;
  lastActive: number;
}

interface CustomerSession {
  token: string;
  customerId: string;
  createdAt: number;
  lastActive: number;
}

const staffSessions = new Map<string, StaffSession>();
const customerSessions = new Map<string, CustomerSession>();

// Logins expire: staff after one long shift, customers after 30 days
const STAFF_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const CUSTOMER_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of staffSessions) {
    if (now - session.createdAt > STAFF_SESSION_MAX_AGE_MS) staffSessions.delete(token);
  }
  for (const [token, session] of customerSessions) {
    if (now - session.createdAt > CUSTOMER_SESSION_MAX_AGE_MS) customerSessions.delete(token);
  }
}, 15 * 60 * 1000).unref();

const ACCOUNT_DEACTIVATED_MESSAGE = 'This account has been deactivated by the Administrator. Please contact your manager.';

// Kill every open session of a staff account (e.g. after the Admin deactivates it)
function revokeStaffSessionsForUser(userId: string): number {
  let revoked = 0;
  for (const [token, session] of staffSessions) {
    if (session.userId === userId) {
      staffSessions.delete(token);
      revoked++;
    }
  }
  return revoked;
}

function generateSessionToken(prefix: 'staff' | 'cust'): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

function getStaffUserFromRequest(req: express.Request): UserRecord | null {
  const authHeader = req.headers.authorization || (req.headers['x-staff-token'] as string);
  let token = '';
  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }
  if (!token) return null;
  const session = staffSessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > STAFF_SESSION_MAX_AGE_MS) {
    staffSessions.delete(token);
    return null;
  }
  session.lastActive = Date.now();
  const user = users.find(u => u.id === session.userId && u.isActive);
  if (!user) {
    // Account was deactivated (or removed) while signed in - drop the session
    staffSessions.delete(token);
    return null;
  }
  return user;
}

// Route guards: any signed-in, active staff member / Administrator only
const requireStaff: express.RequestHandler = (req, res, next) => {
  const user = getStaffUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Please sign in as staff to continue.' });
  }
  (res.locals as any).staffUser = user;
  next();
};

const requireAdmin: express.RequestHandler = (req, res, next) => {
  const user = getStaffUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Please sign in as Administrator to continue.' });
  }
  if (user.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Only the Administrator can do this.' });
  }
  (res.locals as any).staffUser = user;
  next();
};

function getCustomerFromRequest(req: express.Request): CustomerRecord | null {
  const authHeader = (req.headers['x-customer-token'] as string) || req.headers.authorization;
  let token = '';
  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }
  if (!token) return null;
  const session = customerSessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > CUSTOMER_SESSION_MAX_AGE_MS) {
    customerSessions.delete(token);
    return null;
  }
  session.lastActive = Date.now();
  const cust = customers.find(c => c.id === session.customerId);
  return cust || null;
}

// ── API ROUTES ──────────────────────────────────────────────

// Unified Login Route (Single login page: automatically detects Admin, Staff, or Customer)
app.post('/api/auth/unified-login', loginLimiter, (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginId = (identifier || username || email || '').trim();
    const loginPass = String(password || '');

    if (!loginId || !loginPass) {
      return res.status(400).json({ success: false, message: 'Username or email, and password are required.' });
    }

    const cleanId = loginId.toLowerCase();
    const cleanPass = loginPass.trim();

    // 1. Check in Staff / Admin accounts (users array)
    const matchesStaffId = (u: UserRecord) =>
      u.username.toLowerCase() === cleanId ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      u.role.toLowerCase() === cleanId;
    // Prefer an active account, but still match deactivated ones so they get a clear rejection
    let staffUser = users.find(u => u.isActive !== false && matchesStaffId(u)) ||
      users.find(u => u.isActive === false && matchesStaffId(u));

    if (staffUser) {
      const isStaffPassValid =
        bcrypt.compareSync(cleanPass, staffUser.passwordHash) ||
        bcrypt.compareSync(loginPass, staffUser.passwordHash);

      if (isStaffPassValid && staffUser.isActive === false) {
        return res.status(403).json({ success: false, deactivated: true, message: ACCOUNT_DEACTIVATED_MESSAGE });
      }

      if (isStaffPassValid) {
        const token = generateSessionToken('staff');
        staffSessions.set(token, {
          token,
          userId: staffUser.id,
          createdAt: Date.now(),
          lastActive: Date.now()
        });

        return res.json({
          success: true,
          accountType: 'staff',
          role: staffUser.role,
          token,
          user: {
            id: staffUser.id,
            fullName: staffUser.fullName,
            username: staffUser.username,
            role: staffUser.role,
            isActive: staffUser.isActive,
          },
          message: `Welcome back, ${staffUser.fullName}! (${staffUser.role})`
        });
      }
    }

    // 2. Check in Customer accounts (customers array)
    const cleanPhoneDigits = cleanId.replace(/\D/g, '');
    const cust = customers.find(c =>
      c.username.toLowerCase() === cleanId ||
      c.email.toLowerCase() === cleanId ||
      (cleanPhoneDigits.length >= 10 && c.phone && c.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-10)))
    );

    if (cust) {
      const isCustPassValid =
        bcrypt.compareSync(cleanPass, cust.passwordHash) ||
        bcrypt.compareSync(loginPass, cust.passwordHash);

      if (isCustPassValid) {
        const token = generateSessionToken('cust');
        customerSessions.set(token, {
          token,
          customerId: cust.id,
          createdAt: Date.now(),
          lastActive: Date.now()
        });

        return res.json({
          success: true,
          accountType: 'customer',
          token,
          customer: {
            id: cust.id,
            fullName: cust.fullName,
            username: cust.username,
            email: cust.email,
            phone: cust.phone,
            address: cust.address,
            loyaltyPoints: cust.loyaltyPoints
          },
          message: `Welcome back, ${cust.fullName}!`
        });
      }
    }

    // If neither matched
    return res.status(401).json({
      success: false,
      message: 'Invalid username/email or password.'
    });
  } catch (err: any) {
    console.error('[Unified Login Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
});

// Auth Routes (Staff)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername && u.isActive) ||
      users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or inactive.' });
    }

    // Role check (flexible for 'Admin' vs 'Administrator', case-insensitive; optional if not specified)
    const reqRole = String(role || '').toLowerCase().trim();
    const userRole = String(user.role).toLowerCase().trim();
    const isRoleMatch = !reqRole ||
      reqRole === userRole || 
      (reqRole === 'admin' && userRole === 'administrator') || 
      (reqRole === 'administrator' && userRole === 'admin');

    if (!isRoleMatch) {
      return res.status(401).json({ success: false, message: `Role mismatch: User '${user.username}' is registered as ${user.role}.` });
    }

    const validPassword = bcrypt.compareSync(String(password), user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, deactivated: true, message: ACCOUNT_DEACTIVATED_MESSAGE });
    }

    const token = generateSessionToken('staff');
    staffSessions.set(token, {
      token,
      userId: user.id,
      createdAt: Date.now(),
      lastActive: Date.now()
    });

    return res.json({
      success: true,
      token,
      message: 'Logged in successfully!',
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      }
    });
  } catch (err: any) {
    console.error('[Staff Login Endpoint Error]', err);
    return res.status(500).json({ success: false, message: 'Internal server error during staff authentication.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || (req.headers['x-staff-token'] as string);
  let token = '';
  if (typeof authHeader === 'string') {
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  }
  if (token) {
    staffSessions.delete(token);
  }
  res.json({ success: true });
});

// ── REALTIME SERVER-SENT EVENTS (SSE) STREAM ─────────────────
const sseClients = new Set<express.Response>();

const SENSITIVE_FIELDS = ['password_hash', 'passwordHash', 'otp'];
function stripSensitive(row: any) {
  if (!row || typeof row !== 'object') return row;
  const copy = { ...row };
  for (const field of SENSITIVE_FIELDS) delete copy[field];
  return copy;
}

export function broadcastRealtimeEvent(data: { table: string; eventType: string; new?: any; old?: any }) {
  // The stream is public, so never forward password hashes or codes
  const safe = { ...data, new: stripSensitive(data.new), old: stripSensitive(data.old) };
  const payload = `data: ${JSON.stringify(safe)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', success: true, timestamp: new Date().toISOString() });
});

app.get('/api/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Initial connection confirmation
  res.write(`data: ${JSON.stringify({ table: 'connection', eventType: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  // Heartbeat ping every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getStaffUserFromRequest(req);
  if (!user) {
    // Tell the device explicitly when its account was deactivated so it can sign out with a notice.
    // The client also sends its user id, which covers sessions lost to a revoke or server restart.
    const claimedUserId = String(req.headers['x-staff-user-id'] || '').trim();
    const claimedUser = claimedUserId ? users.find(u => u.id === claimedUserId) : undefined;
    if (claimedUser && claimedUser.isActive === false) {
      return res.status(401).json({ error: 'Account deactivated', reason: 'account_deactivated', message: ACCOUNT_DEACTIVATED_MESSAGE });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    role: user.role
  });
});

// ── CUSTOMER AUTH & PROFILE ROUTES ───────────────────────────
// Store temporary OTP codes for mobile and email verification
const phoneOtpStore: Map<string, { otp: string; expiresAt: number; isVerified: boolean }> = new Map();
const emailOtpStore: Map<string, { otp: string; expiresAt: number; isVerified: boolean }> = new Map();

// Helper to send real emails via Nodemailer (Gmail SMTP) or Resend
// Fail fast instead of hanging for minutes when Gmail is slow or unreachable
const SMTP_TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };

async function sendRealEmail(toEmail: string, subject: string, htmlContent: string, textContent?: string): Promise<{ sent: boolean; provider: string; error?: string }> {
  const smtpUser = (process.env.SMTP_USER || 'commonbrewtaytay@gmail.com').trim();
  const rawPass = process.env.SMTP_PASS || '';
  const smtpPass = rawPass.replace(/\s+/g, '');

  const plainText = textContent || htmlContent.replace(/<[^>]+>/g, '').trim();
  let lastError = '';

  if (smtpUser && smtpPass) {
    const nodemailer = await import('nodemailer');

    // Strategy A: Direct SMTP port 587 (Standard STARTTLS - works best on Cloud Run)
    try {
      const transporter587 = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS,
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter587.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail SMTP 587 Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail (SMTP 587)' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.warn('[Gmail SMTP 587 Failed, trying service: gmail]', e.message || e);
    }

    // Strategy B: Nodemailer service 'gmail'
    try {
      const transporterGmail = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS
      });

      const info = await transporterGmail.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail Service Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.warn('[Gmail Service Failed, trying port 465]', e.message || e);
    }

    // Strategy C: Direct SMTP port 465 (SSL)
    try {
      const transporter465 = nodemailer.default.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        ...SMTP_TIMEOUTS,
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter465.sendMail({
        from: `"CommonBrew Taytay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: toEmail,
        subject: subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[Gmail SMTP 465 Success] Verification email delivered to ${toEmail}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'CommonBrew Gmail (SMTP 465)' };
    } catch (e: any) {
      lastError = e.message || String(e);
      console.error('[Gmail SMTP 465 Failed]', e.message || e);
    }
  }

  // Fallback: Resend API (Note: Resend free tier restricts recipient to verified email)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim()) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey.trim()}`
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'CommonBrew Taytay <onboarding@resend.dev>',
          to: [toEmail],
          subject: subject,
          text: plainText,
          html: htmlContent
        })
      });
      const data = await resendRes.json();
      if (resendRes.ok && data.id) {
        console.log(`[Resend Email Sent] Delivered to ${toEmail}:`, data.id);
        return { sent: true, provider: 'Resend API' };
      } else {
        const resendErr = data.message || (typeof data === 'object' ? JSON.stringify(data) : 'Resend error');
        console.error('[Resend API Error]', resendErr);
        if (!lastError) lastError = resendErr;
      }
    } catch (e: any) {
      console.error('[Resend Exception]', e);
    }
  }

  return {
    sent: false,
    provider: 'None',
    error: lastError || 'Unable to send email via Gmail SMTP.'
  };
}

// Endpoint to check if Gmail/Email is already used by another account (Staff, Admin, or Customer in in-memory store and Database)
app.get('/api/auth/check-email', async (req, res) => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  const excludeId = (req.query.excludeId as string || '').trim();

  if (!email || !email.includes('@')) {
    return res.json({ exists: false, message: 'Invalid email' });
  }

  // 1. Check in-memory staff users (Admin & Cashier)
  const existingStaff = users.find(u =>
    u.email && u.email.trim().toLowerCase() === email && (!excludeId || u.id !== excludeId)
  );

  // 2. Check in-memory registered customers
  const existingCust = customers.find(c =>
    c.email && c.email.trim().toLowerCase() === email && (!excludeId || c.id !== excludeId)
  );

  let exists = !!(existingStaff || existingCust);
  let matchedType = existingStaff ? existingStaff.role : existingCust ? 'Customer' : null;

  // 3. Check persistent database (Cloud SQL / Postgres) if configured
  if (!exists && process.env.SQL_HOST && process.env.SQL_USER) {
    try {
      const { db } = await import('./src/db/index.ts');
      const { users: dbUsers } = await import('./src/db/schema.ts');
      const { sql } = await import('drizzle-orm');

      const matches = await db
        .select({ id: dbUsers.id, email: dbUsers.email, role: dbUsers.role })
        .from(dbUsers)
        .where(sql`LOWER(${dbUsers.email}) = ${email}`);

      const filtered = matches.filter(m => !excludeId || m.id !== excludeId);
      if (filtered.length > 0) {
        exists = true;
        matchedType = filtered[0].role || 'Account';
      }
    } catch (e) {
      // Postgres query failed or offline; in-memory store remains authoritative
    }
  }

  return res.json({
    exists,
    message: exists ? 'Email is already used' : 'Email is available',
    matchedType
  });
});

// Endpoint to send Email Verification OTP code
app.post('/api/auth/send-email-otp', otpSendLimiter, async (req, res) => {
  const { email, purpose, userId } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isStaffFlow = purpose === 'staff_registration' || purpose === 'staff_email_update' || purpose === 'admin_email_update';

  // If customer registration, verify not already registered as customer or staff
  if (!isStaffFlow) {
    const existingCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail && (!userId || c.id !== userId));
    const existingStaff = users.find(u => u.email && u.email.toLowerCase() === cleanEmail && (!userId || u.id !== userId));
    if (existingCust || existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }
  }

  // If staff registration, check if already registered as active staff or customer
  if (purpose === 'staff_registration') {
    const existingStaff = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    const existingCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (existingStaff || existingCust) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }
  }

  // If updating email for admin or staff
  if (purpose === 'admin_email_update' || purpose === 'staff_email_update') {
    const existingStaff = users.find(u => u.id !== userId && u.email && u.email.toLowerCase() === cleanEmail);
    const existingCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail && (!userId || c.id !== userId));
    if (existingStaff || existingCust) {
      return res.status(400).json({
        success: false,
        message: 'Email is already used'
      });
    }
  }

  // Generate a random 6-digit OTP code
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();

  emailOtpStore.set(cleanEmail, {
    otp: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    isVerified: false
  });

  const isAdmin = purpose === 'admin_email_update';
  const isStaff = isStaffFlow;
  const flowTitle = isAdmin ? 'Administrator Email Update' : isStaff ? 'Staff Account Verification' : 'Email Verification';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #ebd3bb; border-radius: 12px; background: #fffcf7;">
      <h2 style="color: #3d2314; margin-top: 0;">☕ CommonBrew Taytay - ${flowTitle}</h2>
      <p style="font-size: 15px; color: #4b5563;">Your 6-digit verification code is:</p>
      <div style="background: #3d2314; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
        ${generatedOtp}
      </div>
      <p style="font-size: 13px; color: #6b7280;">This code will expire in 10 minutes. If you did not request this email, please ignore this message.</p>
      <hr style="border: none; border-top: 1px solid #ebd3bb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">CommonBrew Taytay • Unit 7 Leoncio Commercial Bldg, Taytay, Rizal</p>
    </div>
  `;

  const plainText = `CommonBrew Taytay ${flowTitle}\n\nYour 6-digit verification code is: ${generatedOtp}\n\nThis code will expire in 10 minutes.`;

  const mailStatus = await sendRealEmail(cleanEmail, `${generatedOtp} is your CommonBrew Verification Code`, emailHtml, plainText);

  if (mailStatus.sent) {
    return res.json({
      success: true,
      message: `✉️ Verification email sent to ${cleanEmail}! Please check your inbox or spam folder.`,
      realEmailSent: true,
      provider: mailStatus.provider,
      expiresInSeconds: 600
    });
  } else {
    console.log(`[Email OTP Info] Real email dispatch error (${mailStatus.error}). OTP generated: ${generatedOtp}`);
    return res.json({
      success: true,
      message: `Verification code generated for ${cleanEmail}. (Notice: ${mailStatus.error})`,
      realEmailSent: false,
      emailError: mailStatus.error,
      expiresInSeconds: 600
    });
  }
});

// Endpoint to verify Email OTP code
app.post('/api/auth/verify-email-otp', otpVerifyLimiter, (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and verification code are required.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const entry = emailOtpStore.get(cleanEmail);

  if (!entry) {
    return res.status(400).json({
      success: false,
      message: 'No active email verification session found. Please click "Send Code" first.'
    });
  }

  if (Date.now() > entry.expiresAt) {
    emailOtpStore.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      message: 'Email verification code has expired. Please click "Send Code" to request a new code.'
    });
  }

  if (entry.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid 6-digit email code. Please check your email and try again.'
    });
  }

  // Mark as verified
  entry.isVerified = true;
  emailOtpStore.set(cleanEmail, entry);

  res.json({
    success: true,
    message: 'Email address verified successfully! ✓'
  });
});

// Endpoint to send Forgot Password Email Verification OTP
app.post('/api/auth/forgot-password-send-otp', otpSendLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if customer exists
  const existingCust = customers.find(c => c.email.toLowerCase() === cleanEmail);
  if (!existingCust) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address. Please check your spelling or register for an account.'
    });
  }

  // Generate 6-digit OTP code
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();

  emailOtpStore.set(cleanEmail, {
    otp: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    isVerified: false
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #ebd3bb; border-radius: 12px; background: #fffcf7;">
      <h2 style="color: #ea580c; margin-top: 0;">🔒 CommonBrew Taytay - Password Reset Request</h2>
      <p style="font-size: 15px; color: #4b5563;">Hello ${existingCust.fullName},</p>
      <p style="font-size: 15px; color: #4b5563;">We received a request to reset your password. Use the 6-digit verification code below to reset your password:</p>
      <div style="background: #ea580c; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 6px; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
        ${generatedOtp}
      </div>
      <p style="font-size: 13px; color: #6b7280;">This verification code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ebd3bb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">CommonBrew Taytay • Unit 7 Leoncio Commercial Bldg, Taytay, Rizal</p>
    </div>
  `;

  const plainText = `CommonBrew Taytay Password Reset Request\n\nYour 6-digit verification code is: ${generatedOtp}\n\nThis code will expire in 10 minutes.`;

  const mailStatus = await sendRealEmail(cleanEmail, `${generatedOtp} is your CommonBrew Password Reset Code`, emailHtml, plainText);

  if (mailStatus.sent) {
    return res.json({
      success: true,
      message: `✉️ Reset code sent to ${cleanEmail}! Please check your email inbox.`,
      realEmailSent: true,
      provider: mailStatus.provider,
      expiresInSeconds: 600
    });
  } else {
    return res.json({
      success: true,
      message: `Password reset code generated for ${cleanEmail}. (Notice: ${mailStatus.error})`,
      realEmailSent: false,
      emailError: mailStatus.error,
      expiresInSeconds: 600
    });
  }
});

// Endpoint to reset customer password after OTP verification
app.post('/api/auth/reset-password', otpVerifyLimiter, (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email and new password are required.'
    });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 4 characters long.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const entry = emailOtpStore.get(cleanEmail);

  // Check OTP verification status
  const isOtpVerified = entry && (entry.isVerified || (otp && entry.otp === otp.trim() && Date.now() <= entry.expiresAt));

  if (!isOtpVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email verification required! Please enter and verify the 6-digit code first.'
    });
  }

  const cust = customers.find(c => c.email.toLowerCase() === cleanEmail);
  if (!cust) {
    return res.status(404).json({
      success: false,
      message: 'Account not found.'
    });
  }

  // Update password
  cust.passwordHash = bcrypt.hashSync(newPassword, 10);
  syncPasswordToSupabase(cust.id, cust.passwordHash).catch(err => console.error('Supabase customer password sync error:', err));

  // Clean up OTP session
  emailOtpStore.delete(cleanEmail);

  res.json({
    success: true,
    message: '🎉 Your password has been reset successfully! You can now sign in with your new password.'
  });
});

// Helper to dispatch real SMS via Twilio or Semaphore PH SMS API
async function sendRealSms(rawPhone: string, messageText: string): Promise<{ sent: boolean; provider: string; error?: string }> {
  const cleanDigits = rawPhone.replace(/\D/g, '');

  // Format E.164 for Twilio (+639171234567)
  let e164Phone = '';
  if (cleanDigits.startsWith('63')) {
    e164Phone = '+' + cleanDigits;
  } else if (cleanDigits.startsWith('09') && cleanDigits.length === 11) {
    e164Phone = '+63' + cleanDigits.substring(1);
  } else if (cleanDigits.startsWith('9') && cleanDigits.length === 10) {
    e164Phone = '+63' + cleanDigits;
  } else {
    e164Phone = '+' + cleanDigits;
  }

  // Format PH local phone for Semaphore (09171234567)
  let phLocalPhone = cleanDigits;
  if (cleanDigits.startsWith('63') && cleanDigits.length === 12) {
    phLocalPhone = '0' + cleanDigits.substring(2);
  } else if (cleanDigits.startsWith('9') && cleanDigits.length === 10) {
    phLocalPhone = '0' + cleanDigits;
  }

  // 1. Try Semaphore PH SMS Gateway
  const semaphoreApiKey = process.env.SEMAPHORE_API_KEY;
  if (semaphoreApiKey && semaphoreApiKey.trim()) {
    try {
      const senderName = process.env.SEMAPHORE_SENDER_NAME || 'CommonBrew';
      const semaRes = await fetch('https://api.semaphore.co/api/v4/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: semaphoreApiKey.trim(),
          number: phLocalPhone,
          message: messageText,
          sendername: senderName
        })
      });
      const semaData = await semaRes.json();
      if (semaRes.ok && Array.isArray(semaData) && semaData.length > 0 && (semaData[0].status || semaData[0].message_id)) {
        console.log(`[Semaphore Real SMS Sent] Dispatched to ${phLocalPhone}:`, semaData[0]);
        return { sent: true, provider: 'Semaphore PH SMS' };
      } else {
        const errStr = typeof semaData === 'object' ? JSON.stringify(semaData) : 'Semaphore API returned error';
        console.error('[Semaphore SMS Error]', errStr);
        return { sent: false, provider: 'Semaphore PH SMS', error: errStr };
      }
    } catch (err: any) {
      console.error('[Semaphore Fetch Exception]', err);
      return { sent: false, provider: 'Semaphore PH SMS', error: err.message || String(err) };
    }
  }

  // 2. Try Twilio SMS
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
    try {
      const twilioModule = await import('twilio');
      const twilioClient = twilioModule.default(twilioAccountSid.trim(), twilioAuthToken.trim());

      const twilioRes = await twilioClient.messages.create({
        body: messageText,
        from: twilioPhoneNumber.trim(),
        to: e164Phone
      });

      console.log(`[Twilio Real SMS Sent] Message SID ${twilioRes.sid} dispatched to ${e164Phone}`);
      return { sent: true, provider: 'Twilio SMS' };
    } catch (err: any) {
      console.error('[Twilio SMS Error]', err);
      return { sent: false, provider: 'Twilio SMS', error: err.message || String(err) };
    }
  }

  return {
    sent: false,
    provider: 'None',
    error: 'No active SMS provider credentials configured (TWILIO_ACCOUNT_SID or SEMAPHORE_API_KEY in .env).'
  };
}

// Endpoint to send OTP code to mobile number
app.post('/api/auth/send-otp', otpSendLimiter, async (req, res) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid mobile phone number (e.g. 09171234567).'
    });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  // Check if phone number is already registered
  const existingCust = customers.find(c => c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone);
  if (existingCust) {
    return res.status(400).json({
      success: false,
      message: 'This mobile number is already registered to another account. Please sign in or use a different number.'
    });
  }

  // Generate a random 6-digit OTP code
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();
  
  // Store OTP with 10-minute expiry
  phoneOtpStore.set(cleanPhone, {
    otp: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    isVerified: false
  });

  const smsText = `Your CommonBrew Taytay mobile verification code is: ${generatedOtp}. Valid for 10 minutes. Do not share this code.`;

  // Dispatch real SMS
  const smsStatus = await sendRealSms(cleanPhone, smsText);

  if (smsStatus.sent) {
    return res.json({
      success: true,
      message: `📱 Real SMS OTP delivered to ${cleanPhone} via ${smsStatus.provider}! Please check your mobile phone messages.`,
      realSmsSent: true,
      provider: smsStatus.provider,
      expiresInSeconds: 600
    });
  } else {
    console.log(`[SMS Gateway Info] Real SMS not sent (${smsStatus.error}). Demo OTP generated: ${generatedOtp}`);
    return res.json({
      success: true,
      message: `OTP generated for ${cleanPhone}. (Real SMS notice: ${smsStatus.error})`,
      realSmsSent: false,
      smsError: smsStatus.error,
      demoOtp: generatedOtp,
      expiresInSeconds: 600
    });
  }
});

// Endpoint to verify OTP code
app.post('/api/auth/verify-otp', otpVerifyLimiter, (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number and OTP code are required.'
    });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const entry = phoneOtpStore.get(cleanPhone);

  if (!entry) {
    return res.status(400).json({
      success: false,
      message: 'No active OTP verification session for this number. Please click "Send Code" first.'
    });
  }

  if (Date.now() > entry.expiresAt) {
    phoneOtpStore.delete(cleanPhone);
    return res.status(400).json({
      success: false,
      message: 'OTP verification code has expired. Please click "Send Code" to request a new code.'
    });
  }

  if (entry.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid 6-digit OTP code. Please check the code and try again.'
    });
  }

  // Mark as verified
  entry.isVerified = true;
  phoneOtpStore.set(cleanPhone, entry);

  res.json({
    success: true,
    message: 'Mobile phone number verified successfully! ✓'
  });
});

app.post('/api/auth/register-customer', (req, res) => {
  const { fullName, username, email, phone, otp, password, address, defaultAddress } = req.body;
  const userAddress = (address || defaultAddress || '').trim();

  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : '';

  // 1. Check Email OTP Verification status
  const emailEntry = emailOtpStore.get(cleanEmail);
  const isEmailOtpValid = emailEntry && (emailEntry.isVerified || (otp && emailEntry.otp === otp.trim() && Date.now() <= emailEntry.expiresAt));

  // 2. Check Phone OTP Verification status as fallback
  const phoneEntry = cleanPhone ? phoneOtpStore.get(cleanPhone) : null;
  const isPhoneOtpValid = phoneEntry && (phoneEntry.isVerified || (otp && phoneEntry.otp === otp.trim() && Date.now() <= phoneEntry.expiresAt));

  if (!isEmailOtpValid && !isPhoneOtpValid) {
    return res.status(400).json({
      success: false,
      message: 'Email verification required! Please click "Send Code" to verify your email address.'
    });
  }

  const existingEmailCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
  const existingEmailStaff = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
  if (existingEmailCust || existingEmailStaff) {
    return res.status(400).json({ success: false, message: 'Email is already used' });
  }

  const existingUsername = customers.find(c => c.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    return res.status(400).json({ success: false, message: 'Username is already registered.' });
  }

  if (cleanPhone) {
    const existingPhone = customers.find(c => c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone);
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'This mobile number is already registered to another account.' });
    }
  }

  const newCust: CustomerRecord = {
    id: `cust-${Date.now()}`,
    fullName,
    username,
    email: cleanEmail,
    phone: cleanPhone || '',
    passwordHash: bcrypt.hashSync(password, 10),
    address: userAddress,
    loyaltyPoints: 50, // 50 Welcome Points!
    isEmailVerified: !!isEmailOtpValid,
    isPhoneVerified: !!isPhoneOtpValid,
    createdAt: new Date().toISOString()
  };

  customers.push(newCust);
  syncCustomerToSupabase(newCust).catch(err => console.error('Supabase customer registration sync error:', err));

  // Ensure the newly registered customer starts with a completely fresh, empty order history (0 existing orders)
  const cleanEmailLower = cleanEmail.toLowerCase();
  const cleanPhoneDigits = (cleanPhone || '').replace(/\D/g, '');
  for (let i = onlineOrders.length - 1; i >= 0; i--) {
    const o = onlineOrders[i];
    if (
      o.customerId === newCust.id ||
      (o.customerEmail && o.customerEmail.toLowerCase() === cleanEmailLower) ||
      (cleanPhoneDigits && o.customerPhone && o.customerPhone.replace(/\D/g, '') === cleanPhoneDigits)
    ) {
      onlineOrders.splice(i, 1);
    }
  }

  const token = generateSessionToken('cust');
  customerSessions.set(token, {
    token,
    customerId: newCust.id,
    createdAt: Date.now(),
    lastActive: Date.now()
  });
  emailOtpStore.delete(cleanEmail);
  if (cleanPhone) phoneOtpStore.delete(cleanPhone);

  res.json({
    success: true,
    token,
    message: 'Account created & email verified successfully! Earned 50 Welcome Loyalty Points ☕',
    customer: {
      id: newCust.id,
      fullName: newCust.fullName,
      username: newCust.username,
      email: newCust.email,
      phone: newCust.phone,
      address: newCust.address,
      loyaltyPoints: newCust.loyaltyPoints,
      isEmailVerified: newCust.isEmailVerified,
      isPhoneVerified: newCust.isPhoneVerified
    }
  });
});

app.post('/api/auth/login-customer', loginLimiter, (req, res) => {
  const { identifier, password } = req.body; // identifier can be username, email, or mobile phone
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPhoneDigits = cleanId.replace(/\D/g, '');
  const cust = customers.find(c =>
    c.username.toLowerCase() === cleanId ||
    c.email.toLowerCase() === cleanId ||
    (c.id === 'cust-jedi-01' && (cleanId === 'jedigalicia' || cleanId === 'jedi galicia')) ||
    (cleanPhoneDigits.length >= 10 && c.phone && c.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-10)))
  );

  if (!cust || !bcrypt.compareSync(password || '', cust.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
  }

  const token = generateSessionToken('cust');
  customerSessions.set(token, {
    token,
    customerId: cust.id,
    createdAt: Date.now(),
    lastActive: Date.now()
  });

  res.json({
    success: true,
    token,
    customer: {
      id: cust.id,
      fullName: cust.fullName,
      username: cust.username,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      loyaltyPoints: cust.loyaltyPoints
    }
  });
});

app.get('/api/customer/me', (req, res) => {
  const sessionCustomer = getCustomerFromRequest(req);
  if (!sessionCustomer) {
    return res.json({ authenticated: false, customer: null });
  }
  res.json({
    authenticated: true,
    customer: {
      id: sessionCustomer.id,
      fullName: sessionCustomer.fullName,
      username: sessionCustomer.username,
      email: sessionCustomer.email,
      phone: sessionCustomer.phone,
      address: sessionCustomer.address,
      loyaltyPoints: sessionCustomer.loyaltyPoints
    }
  });
});

app.post('/api/customer/logout', (req, res) => {
  const authHeader = (req.headers['x-customer-token'] as string) || req.headers.authorization;
  let token = '';
  if (typeof authHeader === 'string') {
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  }
  if (token) {
    customerSessions.delete(token);
  }
  res.json({ success: true });
});

app.post('/api/customer/update-profile', (req, res) => {
  const sessionCustomer = getCustomerFromRequest(req);
  if (!sessionCustomer) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  const { phone, address, defaultAddress, email } = req.body;
  const newAddress = address !== undefined ? address : defaultAddress;
  if (phone !== undefined) sessionCustomer.phone = phone;
  if (newAddress !== undefined) sessionCustomer.address = newAddress.trim();
  if (email !== undefined) sessionCustomer.email = email;
  if (req.body.password && typeof req.body.password === 'string' && req.body.password.trim().length >= 4) {
    sessionCustomer.passwordHash = bcrypt.hashSync(req.body.password.trim(), 10);
  }
  syncCustomerToSupabase(sessionCustomer).catch(err => console.error('Supabase customer profile sync error:', err));

  res.json({
    success: true,
    customer: {
      id: sessionCustomer.id,
      fullName: sessionCustomer.fullName,
      username: sessionCustomer.username,
      email: sessionCustomer.email,
      phone: sessionCustomer.phone,
      address: sessionCustomer.address,
      loyaltyPoints: sessionCustomer.loyaltyPoints
    }
  });
});

// ── STORE INFORMATION ROUTE ───────────────────────────────
app.get('/api/store-info', (req, res) => {
  res.json(storeInfo);
});

app.put('/api/store-info', requireAdmin, async (req, res) => {
  const { name, storeName, address, phone, email, hours, openingTime, closingTime, tagline, aboutText, mapsUrl, facebookUrl, instagramUrl } = req.body;
  if (name !== undefined || storeName !== undefined) storeInfo.name = (name ?? storeName);
  if (address !== undefined) storeInfo.address = address;
  if (phone !== undefined) storeInfo.phone = phone;
  if (email !== undefined) storeInfo.email = email;
  if (hours !== undefined) storeInfo.hours = hours;
  if (tagline !== undefined) storeInfo.tagline = tagline;
  if (aboutText !== undefined) storeInfo.aboutText = aboutText;
  if (mapsUrl !== undefined) storeInfo.mapsUrl = mapsUrl;
  if (facebookUrl !== undefined) storeInfo.facebookUrl = facebookUrl;
  if (instagramUrl !== undefined) storeInfo.instagramUrl = instagramUrl;

  // Sync to Supabase store_settings table
  syncStoreSettingsToSupabase(storeInfo).catch(err => console.error('Failed to sync store info to Supabase:', err));

  res.json({ success: true, storeInfo });
});

// ── ONLINE ORDERING ROUTES ──────────────────────────────────
app.get('/api/online-orders', requireStaff, (req, res) => {
  const { status } = req.query;
  let list = [...onlineOrders];
  if (status && status !== 'all') {
    list = list.filter(o => o.status.toLowerCase() === String(status).toLowerCase());
  }
  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

app.get('/api/customer/orders', (req, res) => {
  // Only the signed-in customer's own orders - never trust ids/emails from the URL
  const sessionCustomer = getCustomerFromRequest(req);
  if (!sessionCustomer) {
    return res.status(401).json({ success: false, message: 'Please sign in to view your orders.' });
  }
  const custId = sessionCustomer.id;
  const email = sessionCustomer.email;
  const phone = sessionCustomer.phone;

  let myOrders = onlineOrders.filter(o => {
    if (custId && o.customerId === custId) return true;
    if (email && o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase()) return true;
    if (phone && o.customerPhone && o.customerPhone.replace(/\D/g, '') === phone.replace(/\D/g, '')) return true;
    if (sessionCustomer) {
      if (o.customerId === sessionCustomer.id) return true;
      if (o.customerEmail && o.customerEmail.toLowerCase() === sessionCustomer.email?.toLowerCase()) return true;
    }
    return false;
  });

  myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(myOrders.map(o => {
    if (o.status === 'Cancelled' && !o.cancelReason) {
      const m = (o.notes || '').match(/\[Cancelled: ([^\]]+)\]/);
      if (m) return { ...o, cancelReason: m[1] };
    }
    return o;
  }));
});

app.post('/api/online-orders/create', (req, res) => {
  const sessionCustomer = getCustomerFromRequest(req);
  const { customerName, customerPhone, customerEmail, orderType, deliveryAddress, tableNumber, paymentMethod, items, notes, useLoyaltyPoints, gcashReferenceNumber, gcashReceiptImage } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty.' });
  }

  // Enforce GCash Payment Receipt requirement for GCash payments
  if (paymentMethod === 'GCash') {
    const cleanGcashReceipt = typeof gcashReceiptImage === 'string' ? gcashReceiptImage.trim() : '';
    if (!cleanGcashReceipt) {
      return res.status(400).json({
        success: false,
        message: 'GCash Payment Receipt is required to proceed and confirm your order. Please download your GCash payment receipt and upload it.'
      });
    }
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
  const deliveryFee = orderType === 'Delivery' ? 45 : 0;
  
  // Loyalty Points Redemption (Every 100 points = ₱110 discount, deducts 100 points, remaining points stay in balance)
  let loyaltyDiscount = 0;
  let loyaltyPointsRedeemed = 0;
  const isRedeemingLoyalty = Boolean(useLoyaltyPoints && sessionCustomer && sessionCustomer.loyaltyPoints >= 100);

  if (isRedeemingLoyalty && sessionCustomer) {
    loyaltyDiscount = Math.min(110, subtotal + deliveryFee);
    loyaltyPointsRedeemed = 100;
    // Deduct 100 points so any remaining points (e.g., 105 - 100 = 5) remain in customer balance
    sessionCustomer.loyaltyPoints = Math.max(0, sessionCustomer.loyaltyPoints - 100);
  }

  const totalAmount = Math.max(0, subtotal + deliveryFee - loyaltyDiscount);
  const now = new Date();
  const orderRef = `CB-ONL-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: OnlineOrderRecord = {
    id: `onl-${Date.now()}`,
    orderRef,
    customerId: sessionCustomer?.id || undefined,
    customerName: customerName || sessionCustomer?.fullName || 'Guest Customer',
    customerPhone: customerPhone || sessionCustomer?.phone || 'N/A',
    customerEmail: customerEmail || sessionCustomer?.email || '',
    orderType: orderType || 'Pickup',
    deliveryAddress: orderType === 'Delivery' ? (deliveryAddress || sessionCustomer?.address || '') : undefined,
    tableNumber: orderType === 'DineIn' ? tableNumber : undefined,
    paymentMethod: paymentMethod || 'GCash',
    gcashAccount: paymentMethod === 'GCash' ? '09474960778' : undefined,
    gcashReferenceNumber: paymentMethod === 'GCash' ? (gcashReferenceNumber || undefined) : undefined,
    gcashReceiptImage: paymentMethod === 'GCash' ? (gcashReceiptImage || undefined) : undefined,
    items: items.map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
      subtotal: Number(i.unitPrice) * Number(i.quantity),
      isUpsize: Boolean(i.isUpsize),
      sugarLevel: i.sugarLevel,
      iceLevel: i.iceLevel,
      addons: Array.isArray(i.addons) ? i.addons : [],
      specialInstructions: i.specialInstructions
    })),
    subtotal,
    deliveryFee,
    loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
    loyaltyPointsRedeemed: loyaltyPointsRedeemed > 0 ? loyaltyPointsRedeemed : undefined,
    totalAmount,
    inventoryDeducted: true,
    status: 'Pending',
    notes,
    createdAt: now.toISOString()
  };

  onlineOrders.unshift(newOrder);

  // Sync online order to Cloud SQL and Supabase
  syncOnlineOrderToCloudSql(newOrder).catch(err => console.error('Cloud SQL online order sync error:', err));
  syncOnlineOrderToSupabase(newOrder).catch(err => console.error('Supabase online order sync error:', err));

  // Immediately deduct inventory stock (including add-ons such as Nata De Coco)
  deductInventoryForOrder(newOrder.items, newOrder.orderRef, 'Online Customer Order');

  // Add loyalty points if customer logged in: 5 points per ₱50 spent on amount paid
  let newlyEarnedPoints = 0;
  if (sessionCustomer) {
    newlyEarnedPoints = Math.floor(totalAmount / 50) * 5;
    sessionCustomer.loyaltyPoints += newlyEarnedPoints;
    syncCustomerToSupabase(sessionCustomer).catch(err => console.error('Supabase customer points sync error:', err));
  }

  res.json({
    success: true,
    orderRef: newOrder.orderRef,
    totalAmount: newOrder.totalAmount,
    loyaltyDiscount,
    loyaltyPointsRedeemed,
    newlyEarnedPoints,
    customer: sessionCustomer ? {
      id: sessionCustomer.id,
      fullName: sessionCustomer.fullName,
      username: sessionCustomer.username,
      email: sessionCustomer.email,
      phone: sessionCustomer.phone,
      address: sessionCustomer.address,
      loyaltyPoints: sessionCustomer.loyaltyPoints
    } : null,
    message: 'Online order placed successfully! Check status in your profile.'
  });
});

app.post('/api/online-orders/update-status', requireStaff, async (req, res) => {
  const staffUser = getStaffUserFromRequest(req);
  const { orderId, status, cancelReason } = req.body;
  console.log('[Cancel Debug]', { orderId, status, cancelReason });
  const order = onlineOrders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();

    // Record why the order was cancelled (e.g. fake / random GCash receipt)
  if (status === 'Cancelled') {
    const reasonText = (typeof cancelReason === 'string' ? cancelReason.trim() : '').slice(0, 300) || 'No reason provided';
    order.cancelReason = reasonText;
    order.cancelledAt = order.updatedAt;
    // Also keep it in notes so it survives DB sync (no dedicated column)
    const baseNotes = (order.notes || '').replace(/\s*\[Cancelled: [^\]]*\]\s*$/, '').trim();
    order.notes = `${baseNotes}${baseNotes ? ' ' : ''}[Cancelled: ${reasonText}]`;
  }

  // Deduct inventory when order starts 'Preparing', 'Ready', or gets 'Completed' if not done previously
  if ((status === 'Preparing' || status === 'Ready' || status === 'Completed') && !order.inventoryDeducted) {
    deductInventoryForOrder(order.items, order.orderRef, staffUser?.fullName || 'Online System');
    order.inventoryDeducted = true;
  }

  // Restore inventory if order is cancelled
  if (status === 'Cancelled' && order.inventoryDeducted) {
    restoreInventoryForOrder(order.items, order.orderRef, staffUser?.fullName || 'Online Order Cancelled');
    order.inventoryDeducted = false;
  }
    // Refund loyalty points when an order is cancelled
  if (status === 'Cancelled' && oldStatus !== 'Cancelled' && order.customerId) {
    const cust = customers.find(c => c.id === order.customerId);
    if (cust) {
      // 1) Give back the points the customer spent on this order
      const pointsToRefund = order.loyaltyPointsRedeemed || 0;
      // 2) Take back the points this order earned (they were added when the order was placed)
      const pointsToRemove = Math.floor((order.totalAmount || 0) / 50) * 5;

      cust.loyaltyPoints = Math.max(0, cust.loyaltyPoints + pointsToRefund - pointsToRemove);
      syncCustomerToSupabase(cust).catch(err => console.error('Supabase customer points refund sync error:', err));
      console.log(`[Loyalty Refund] ${order.orderRef}: +${pointsToRefund} refunded, -${pointsToRemove} earned removed. New balance: ${cust.loyaltyPoints}`);
    }
  }

  let emailDeliveryResult: {
    attempted: boolean;
    sent: boolean;
    provider?: string;
    recipient?: string;
    message?: string;
    subject?: string;
    error?: string;
  } = {
    attempted: false,
    sent: false
  };

  // When admin/cashier marks order as 'Ready', automatically dispatch notification email to customer
  if (status === 'Ready') {
    // 1. Locate customer's email address
    let recipientEmail = (order.customerEmail || '').trim();
    if (!recipientEmail && order.customerId) {
      const cust = customers.find(c => c.id === order.customerId);
      if (cust?.email) {
        recipientEmail = cust.email.trim();
      }
    }

    // 2. Build items summary text (e.g., Your order "Matcha Latte" x 1 is on the way please wait)
    const itemsSummary = order.items
      .map(i => `"${i.productName}" x ${i.quantity}`)
      .join(', ');

    const isDelivery = order.orderType === 'Delivery';
    const isPickup = order.orderType === 'Pickup';
    const isDineIn = order.orderType === 'DineIn';

    const deliveryHeadline = isDelivery
      ? `Your order ${itemsSummary} is on the way, please wait!`
      : isPickup
      ? `Your order ${itemsSummary} is ready for pickup!`
      : `Your order ${itemsSummary} is ready for your table!`;

    const emailSubject = isDelivery
      ? `🚚 Your CommonBrew order is on the way! (${itemsSummary})`
      : isPickup
      ? `☕ Your CommonBrew order is ready for pickup! (${itemsSummary})`
      : `☕ Your CommonBrew order is ready! (${itemsSummary})`;

    // 3. Construct premium, mobile-responsive HTML email
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfbf7; border-radius: 16px; overflow: hidden; border: 1px solid #e7dfd5; box-shadow: 0 6px 24px rgba(0,0,0,0.06); color: #1f2937;">
        <!-- Brand Header -->
        <div style="background: linear-gradient(135deg, #2b1810 0%, #3d2314 60%, #54331a 100%); color: #ffffff; padding: 30px 24px; text-align: center; border-bottom: 4px solid #d97706;">
          <div style="display: inline-block; background: #ffffff; color: #2b1810; font-weight: 900; font-size: 13px; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            CommonBrew Taytay
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #fef3c7;">
            ${isDelivery ? '🚚 Order Dispatched & On The Way!' : isPickup ? '☕ Order Ready for Pickup!' : '☕ Order Ready to Serve!'}
          </h1>
          <p style="margin: 8px 0 0; color: #e5e7eb; font-size: 14px;">
            Order Reference: <strong style="color: #fbbf24; font-size: 15px; letter-spacing: 0.03em;">#${order.orderRef}</strong>
          </p>
        </div>

        <div style="padding: 24px;">
          <!-- Prominent Notification Banner -->
          <div style="background: ${isDelivery ? '#eff6ff' : '#f0fdf4'}; border-left: 5px solid ${isDelivery ? '#2563eb' : '#16a34a'}; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <p style="margin: 0 0 8px; font-size: 17px; font-weight: 800; color: ${isDelivery ? '#1e40af' : '#15803d'}; line-height: 1.4;">
              ${deliveryHeadline}
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #374151;">
              ${isDelivery
                ? `Hello <strong>${order.customerName}</strong>! Our kitchen barista has just completed preparing your order and our delivery rider is now on the way to your delivery address. Please keep your phone reachable for any rider updates.`
                : isPickup
                ? `Hello <strong>${order.customerName}</strong>! Your freshly handcrafted beverages and treats are packaged and waiting for you at our CommonBrew Taytay stall. Please present your order ref <strong>#${order.orderRef}</strong> to the counter.`
                : `Hello <strong>${order.customerName}</strong>! Your order is ready and is being brought over to Table ${order.tableNumber || '1'}. Sit back, relax, and enjoy!`
              }
            </p>
          </div>

          <!-- Delivery Details Card (if Delivery) -->
          ${isDelivery ? `
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #1f2937; text-transform: uppercase; letter-spacing: 0.04em;">
                📍 Destination & Contact
              </h3>
              <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">
                <div><strong>Customer:</strong> ${order.customerName}</div>
                <div><strong>Mobile Phone:</strong> ${order.customerPhone}</div>
                <div><strong>Delivery Address:</strong> ${order.deliveryAddress || 'Taytay, Rizal'}</div>
                <div><strong>Payment:</strong> ${order.paymentMethod}${order.gcashReceiptImage ? ' (GCash Receipt Attached 📄)' : (order.gcashReferenceNumber ? ` (GCash Ref: <strong>${order.gcashReferenceNumber}</strong>)` : '')}</div>
              </div>
            </div>
          ` : ''}

          <!-- Order Summary Table -->
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 800; color: #1f2937; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
              🧾 Order Items (${order.items.length})
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="color: #6b7280; text-align: left; font-size: 12px; text-transform: uppercase;">
                  <th style="padding-bottom: 8px;">Item Description</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="border-top: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0;">
                      <div style="font-weight: 700; color: #1f2937;">${item.productName}</div>
                      ${item.sugarLevel || item.iceLevel ? `<div style="font-size: 12px; color: #6b7280;">Sugar: ${item.sugarLevel || 'Regular'} | Ice: ${item.iceLevel || 'Regular'}</div>` : ''}
                      ${item.addons && item.addons.length > 0 ? `<div style="font-size: 12px; color: #059669; font-weight: 600;">+ ${item.addons.join(', ')}</div>` : ''}
                      ${item.specialInstructions ? `<div style="font-size: 12px; color: #d97706; font-style: italic;">Note: "${item.specialInstructions}"</div>` : ''}
                    </td>
                    <td style="padding: 10px 0; text-align: center; color: #374151; font-weight: 700;">
                      x${item.quantity}
                    </td>
                    <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1f2937;">
                      ₱${item.subtotal}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Price Totals -->
            <div style="border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 12px; font-size: 13px; color: #4b5563;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Subtotal:</span>
                <span>₱${order.subtotal}</span>
              </div>
              ${order.deliveryFee > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span>Delivery Fee:</span>
                  <span>₱${order.deliveryFee}</span>
                </div>
              ` : ''}
              ${order.loyaltyDiscount && order.loyaltyDiscount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669; font-weight: 700;">
                  <span>Loyalty Member Discount:</span>
                  <span>-₱${order.loyaltyDiscount}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #2b1810; margin-top: 8px; border-top: 1px dashed #d1d5db; padding-top: 8px;">
                <span>Total Amount:</span>
                <span style="color: #059669;">₱${order.totalAmount}</span>
              </div>
            </div>
          </div>

          <!-- Store Assistance -->
          <div style="background: #f9fafb; border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center; margin-bottom: 20px;">
            <strong style="color: #374151; display: block; margin-bottom: 4px;">Need help with your order?</strong>
            <span>Reach out to CommonBrew Taytay directly at </span>
            <strong style="color: #2563eb;">09474960778</strong>
            <span> or email </span>
            <strong style="color: #2563eb;">commonbrewtaytay@gmail.com</strong>
          </div>

          <!-- Brand & Faith Footer -->
          <div style="text-align: center; border-top: 1px solid #e7dfd5; padding-top: 18px; font-size: 12px; color: #9ca3af;">
            <p style="margin: 0 0 6px; font-style: italic; color: #6b7280;">
              "Every good and perfect gift is from above." — James 1:17
            </p>
            <p style="margin: 0; font-weight: 700; color: #4b5563;">
              CommonBrew Coffee & Tea • Taytay, Rizal
            </p>
            <p style="margin: 4px 0 0; color: #9ca3af; font-size: 11px;">
              Handcrafted with prayer, passion, and premium quality beans.
            </p>
          </div>
        </div>
      </div>
    `;

    // 4. Plain text fallback
    const emailPlainText = `
COMMONBREW TAYTAY - ORDER STATUS UPDATE
=======================================

${deliveryHeadline}

Order Reference: #${order.orderRef}
Customer: ${order.customerName}
Mobile: ${order.customerPhone}
${isDelivery ? `Delivery Address: ${order.deliveryAddress || 'Taytay, Rizal'}` : ''}
Payment Method: ${order.paymentMethod}${order.gcashReceiptImage ? ' (Receipt Attached 📄)' : (order.gcashReferenceNumber ? ` (Ref: ${order.gcashReferenceNumber})` : '')}

ORDER ITEMS:
${order.items.map(i => `- ${i.productName} x${i.quantity} = ₱${i.subtotal}`).join('\n')}

Subtotal: ₱${order.subtotal}
${order.deliveryFee > 0 ? `Delivery Fee: ₱${order.deliveryFee}\n` : ''}
${order.loyaltyDiscount ? `Loyalty Discount: -₱${order.loyaltyDiscount}\n` : ''}
Total: ₱${order.totalAmount}

Thank you for choosing CommonBrew!
For immediate inquiries, call 09474960778 or email commonbrewtaytay@gmail.com.
    `.trim();

    // 5. Send real email if recipient email is available
    if (recipientEmail && recipientEmail.includes('@')) {
      emailDeliveryResult.attempted = true;
      emailDeliveryResult.recipient = recipientEmail;
      emailDeliveryResult.message = deliveryHeadline;
      emailDeliveryResult.subject = emailSubject;

      try {
        const mailRes = await sendRealEmail(recipientEmail, emailSubject, emailHtml, emailPlainText);
        emailDeliveryResult.sent = Boolean(mailRes.sent);
        emailDeliveryResult.provider = mailRes.provider;
        order.deliveryEmailSent = Boolean(mailRes.sent);
        order.deliveryEmailRecipient = recipientEmail;
        order.deliveryEmailSentAt = new Date().toISOString();
        console.log(`[Order Ready Email] Successfully sent to ${recipientEmail} for order ${order.orderRef} via ${mailRes.provider}`);
      } catch (err: any) {
        emailDeliveryResult.sent = false;
        emailDeliveryResult.error = err.message || String(err);
        console.error(`[Order Ready Email Error] Failed to send email to ${recipientEmail}:`, err);
      }
    } else {
      console.log(`[Order Ready] Order ${order.orderRef} marked Ready. No customer email address on file.`);
      emailDeliveryResult.attempted = false;
      emailDeliveryResult.sent = false;
      emailDeliveryResult.recipient = '';
      emailDeliveryResult.message = deliveryHeadline;
      emailDeliveryResult.error = 'No customer email address on file for this order';
    }
  }

  // If order completed, log to POS transactions for revenue tracking
  if (status === 'Completed' && oldStatus !== 'Completed') {
    const newTx: TransactionRecord = {
      id: `tx-onl-${Date.now()}`,
      transactionRef: order.orderRef,
      cashierId: staffUser?.id || 'online-sys',
      cashierName: staffUser?.fullName || 'Online Orders System',
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      cashTendered: order.totalAmount,
      changeAmount: 0,
      status: 'completed',
      createdAt: new Date().toISOString(),
      items: order.items.map((i, idx) => ({
        id: `txi-${Date.now()}-${idx}`,
        transactionId: `tx-onl-${Date.now()}`,
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        subtotal: i.subtotal,
        isUpsize: i.isUpsize,
        addons: i.addons
      }))
    };
    transactions.unshift(newTx);
    syncTransactionToCloudSql(newTx).catch(err => console.error('Cloud SQL tx sync error:', err));
    syncTransactionToSupabase(newTx).catch(err => console.error('Supabase tx sync error:', err));
  }

  // Also sync online order updated status to Cloud SQL & Supabase
  syncOnlineOrderToCloudSql(order).catch(err => console.error('Cloud SQL order status sync error:', err));
  syncOnlineOrderToSupabase(order).catch(err => console.error('Supabase order status sync error:', err));

  res.json({
    success: true,
    order,
    emailDelivery: emailDeliveryResult
  });
});

// Helper to evaluate recipe requirements and stock availability for a product
function enrichProductWithStock(p: ProductRecord) {
  const cat = categories.find(c => c.id === p.categoryId);
  const recs = productRecipes.filter(r => r.productId === p.id).map(r => {
    const inv = inventory.find(i => i.id === r.inventoryItemId && !i.isArchived);
    return {
      ...r,
      inventoryItemName: inv?.name || 'Ingredient',
      unit: inv?.unit || '',
      currentStock: inv ? inv.currentStock : 0,
      criticalLevel: inv ? inv.criticalLevel : 0
    };
  });

  const upRecs = productUpsizeRecipes.filter(r => r.productId === p.id).map(r => {
    const inv = inventory.find(i => i.id === r.inventoryItemId && !i.isArchived);
    return {
      ...r,
      inventoryItemName: inv?.name || 'Ingredient',
      unit: inv?.unit || '',
      currentStock: inv ? inv.currentStock : 0,
      criticalLevel: inv ? inv.criticalLevel : 0
    };
  });

  // Calculate depleted / insufficient ingredients for regular size recipe
  const depletedIngredients: Array<{
    inventoryItemId: string;
    name: string;
    currentStock: number;
    unit: string;
    requiredQuantity: number;
  }> = [];

  if (recs.length > 0) {
    for (const r of recs) {
      const inv = inventory.find(i => i.id === r.inventoryItemId && !i.isArchived);
      const stock = inv ? inv.currentStock : 0;
      // If raw material stock is 0 or insufficient for 1 serving
      if (!inv || stock <= 0 || stock < r.quantity) {
        depletedIngredients.push({
          inventoryItemId: r.inventoryItemId,
          name: inv?.name || r.inventoryItemName || 'Raw Material',
          currentStock: Math.max(0, stock),
          unit: inv?.unit || r.unit || '',
          requiredQuantity: r.quantity
        });
      }
    }
  }

  // Calculate depleted ingredients for 22oz upsize
  const depletedUpsizeIngredients: Array<{
    inventoryItemId: string;
    name: string;
    currentStock: number;
    unit: string;
    requiredQuantity: number;
  }> = [];

  if (upRecs.length > 0) {
    for (const r of upRecs) {
      const inv = inventory.find(i => i.id === r.inventoryItemId && !i.isArchived);
      const stock = inv ? inv.currentStock : 0;
      if (!inv || stock <= 0 || stock < r.quantity) {
        depletedUpsizeIngredients.push({
          inventoryItemId: r.inventoryItemId,
          name: inv?.name || r.inventoryItemName || 'Raw Material',
          currentStock: Math.max(0, stock),
          unit: inv?.unit || r.unit || '',
          requiredQuantity: r.quantity
        });
      }
    }
  }

  const isBaseOutOfStock = depletedIngredients.length > 0;
  const isOutOfStock = !p.isAvailable || isBaseOutOfStock;

  let outOfStockReason = '';
  if (!p.isAvailable) {
    outOfStockReason = 'Marked unavailable by manager';
  } else if (isBaseOutOfStock) {
    outOfStockReason = `Out of Stock: ${depletedIngredients.map(d => `${d.name} (${d.currentStock} ${d.unit} remaining)`).join(', ')}`;
  }

  return {
    ...p,
    categoryName: cat?.name || 'General',
    recipes: recs,
    upsizeRecipes: upRecs,
    isOutOfStock,
    isBaseOutOfStock,
    isUpsizeOutOfStock: depletedUpsizeIngredients.length > 0,
    outOfStockReason,
    outOfStockIngredients: depletedIngredients.map(d => d.name),
    depletedIngredients,
    depletedUpsizeIngredients
  };
}

// Categories & Products
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const { categoryId } = req.query;
  let list = products.filter(p => !p.isArchived);
  if (categoryId && categoryId !== 'all') {
    list = list.filter(p => p.categoryId === categoryId);
  }

  const enriched = list.map(enrichProductWithStock);
  res.json(enriched);
});

app.get('/api/products/all', requireAdmin, (req, res) => {
  const enriched = products.map(enrichProductWithStock);
  res.json(enriched);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, categoryId, price, imageUrl, productType, upsizePrice, recipes, upsizeRecipes } = req.body;

  const newProd: ProductRecord = {
    id: `prod-${Date.now()}`,
    name,
    categoryId: categoryId || 'cat-1',
    price: Number(price) || 0,
    imageUrl,
    isAvailable: true,
    productType: productType || 'Drink',
    upsizePrice: upsizePrice ? Number(upsizePrice) : null,
    createdAt: new Date().toISOString()
  };

  products.push(newProd);

  if (Array.isArray(recipes)) {
    recipes.forEach((r: any) => {
      if (r.inventoryItemId && r.quantity > 0) {
        productRecipes.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: newProd.id,
          inventoryItemId: r.inventoryItemId,
          quantity: Number(r.quantity)
        });
      }
    });
  }

  if (Array.isArray(upsizeRecipes)) {
    upsizeRecipes.forEach((r: any) => {
      if (r.inventoryItemId && r.quantity > 0) {
        productUpsizeRecipes.push({
          id: `uprec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: newProd.id,
          inventoryItemId: r.inventoryItemId,
          quantity: Number(r.quantity)
        });
      }
    });
  }

  // Sync new product to Supabase
  syncProductToSupabase(newProd, recipes, upsizeRecipes).catch(err => console.error('Supabase product sync error:', err));

  res.json({ success: true, product: newProd });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const pIndex = products.findIndex(p => p.id === id);
  if (pIndex === -1) return res.status(404).json({ error: 'Product not found' });

  const { name, categoryId, price, imageUrl, productType, upsizePrice, recipes, upsizeRecipes } = req.body;

  products[pIndex] = {
    ...products[pIndex],
    name: name ?? products[pIndex].name,
    categoryId: categoryId ?? products[pIndex].categoryId,
    price: price !== undefined ? Number(price) : products[pIndex].price,
    imageUrl: imageUrl !== undefined ? imageUrl : products[pIndex].imageUrl,
    productType: productType ?? products[pIndex].productType,
    upsizePrice: upsizePrice !== undefined ? (upsizePrice ? Number(upsizePrice) : null) : products[pIndex].upsizePrice,
  };

  // Replace recipes
  if (Array.isArray(recipes)) {
    for (let i = productRecipes.length - 1; i >= 0; i--) {
      if (productRecipes[i].productId === id) productRecipes.splice(i, 1);
    }
    recipes.forEach((r: any) => {
      if (r.inventoryItemId && r.quantity > 0) {
        productRecipes.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: id,
          inventoryItemId: r.inventoryItemId,
          quantity: Number(r.quantity)
        });
      }
    });
  }

  if (Array.isArray(upsizeRecipes)) {
    for (let i = productUpsizeRecipes.length - 1; i >= 0; i--) {
      if (productUpsizeRecipes[i].productId === id) productUpsizeRecipes.splice(i, 1);
    }
    upsizeRecipes.forEach((r: any) => {
      if (r.inventoryItemId && r.quantity > 0) {
        productUpsizeRecipes.push({
          id: `uprec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: id,
          inventoryItemId: r.inventoryItemId,
          quantity: Number(r.quantity)
        });
      }
    });
  }

  // Sync edited product to Supabase
  syncProductToSupabase(products[pIndex], recipes, upsizeRecipes).catch(err => console.error('Supabase product sync error:', err));

  res.json({ success: true });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const p = products.find(p => p.id === id);
  if (p) p.isAvailable = false;
  syncProductAvailabilityToSupabase(id, false).catch(err => console.error('Supabase product availability sync error:', err));
  res.json({ success: true });
});

app.post('/api/products/:id/restore', requireAdmin, (req, res) => {
  const { id } = req.params;
  const p = products.find(p => p.id === id);
  if (p) p.isAvailable = true;
  syncProductAvailabilityToSupabase(id, true).catch(err => console.error('Supabase product availability sync error:', err));
  res.json({ success: true });
});

// POS Transaction Handler
app.post('/api/pos/transaction', requireStaff, (req, res) => {
  const staffUser = getStaffUserFromRequest(req);
  const { paymentMethod, cashTendered, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order.' });
  }

  // Stock check: Verify no ordered product requires depleted / out-of-stock raw materials
  for (const item of items) {
    const rawProdId = item.productId || (item.id && item.id.includes('-') ? item.id.substring(0, item.id.lastIndexOf('-')) : item.id);
    let targetProd = products.find(p => p.id === rawProdId);
    if (!targetProd && item.productName) {
      const cleanName = item.productName.split('(')[0].split('[')[0].trim().toLowerCase();
      targetProd = products.find(p => p.name.toLowerCase() === cleanName || cleanName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(cleanName));
    }

    if (targetProd) {
      const applicableRecipes = item.isUpsize
        ? productUpsizeRecipes.filter(r => r.productId === targetProd.id)
        : productRecipes.filter(r => r.productId === targetProd.id);

      const recipesToUse = applicableRecipes.length > 0
        ? applicableRecipes
        : productRecipes.filter(r => r.productId === targetProd.id);

      const orderQty = Math.max(1, Number(item.quantity) || 1);

      for (const rec of recipesToUse) {
        const invItem = inventory.find(inv => inv.id === rec.inventoryItemId);
        const requiredTotal = rec.quantity * orderQty;
        if (!invItem || invItem.currentStock <= 0 || invItem.currentStock < requiredTotal) {
          const invName = invItem?.name || 'Raw Material';
          const currentLeft = invItem ? Math.max(0, invItem.currentStock) : 0;
          const unit = invItem?.unit || '';
          return res.status(400).json({
            success: false,
            message: `Cannot process order: "${targetProd.name}" is Out of Stock. Raw material "${invName}" has only ${currentLeft} ${unit} remaining (requires ${requiredTotal} ${unit}).`
          });
        }
      }
    }
  }

  const now = new Date();
  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
  const totalAmount = subtotal;
  const change = cashTendered ? Math.max(0, Number(cashTendered) - totalAmount) : 0;
  const refCode = `CB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}`,
    transactionRef: refCode,
    cashierId: staffUser?.id || 'u-2',
    cashierName: staffUser?.fullName || 'Maria Cashier',
    paymentMethod: paymentMethod || 'Cash',
    subtotal,
    totalAmount,
    cashTendered: cashTendered ? Number(cashTendered) : null,
    changeAmount: change,
    status: 'completed',
    createdAt: now.toISOString(),
    items: items.map((i: any, idx: number) => ({
      id: `txi-${Date.now()}-${idx}`,
      transactionId: `tx-${Date.now()}`,
      productId: i.productId,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
      subtotal: Number(i.unitPrice) * Number(i.quantity),
      isUpsize: Boolean(i.isUpsize),
      addons: Array.isArray(i.addons) ? i.addons : []
    }))
  };

  transactions.unshift(newTx);

  // Sync transaction to Cloud SQL and Supabase
  syncTransactionToCloudSql(newTx).catch(err => console.error('Cloud SQL tx sync error:', err));
  syncTransactionToSupabase(newTx).catch(err => console.error('Supabase tx sync error:', err));

  // Deduct inventory stock based on recipes
  deductInventoryForOrder(items, refCode, staffUser?.fullName || 'Maria Cashier');

  res.json({
    success: true,
    transactionRef: newTx.transactionRef,
    totalAmount: newTx.totalAmount,
    change: newTx.changeAmount
  });
});

// Dashboard Analytics
app.get('/api/dashboard/analytics', requireAdmin, (req, res) => {
  const period = (req.query.period as string) || 'Today';
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Exclude voided transactions
  const validTransactions = transactions.filter(t => t.status !== 'Voided' && t.status !== 'void');

  // Filter based on requested period
  let periodTxns = validTransactions;
  if (period === 'Today') {
    periodTxns = validTransactions.filter(t => t.createdAt.startsWith(todayStr));
  } else if (period === 'Weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    periodTxns = validTransactions.filter(t => new Date(t.createdAt) >= weekAgo);
  } else if (period === 'Monthly') {
    const monthAgo = new Date();
    monthAgo.setDate(now.getDate() - 30);
    periodTxns = validTransactions.filter(t => new Date(t.createdAt) >= monthAgo);
  } else if (period === 'Yearly') {
    const yearAgo = new Date();
    yearAgo.setDate(now.getDate() - 365);
    periodTxns = validTransactions.filter(t => new Date(t.createdAt) >= yearAgo);
  }

  const todayRevenue = periodTxns.reduce((sum, t) => sum + t.totalAmount, 0);
  const todayTransactions = periodTxns.length;

  // Low stock inventory items
  const lowStockItems = inventory.map(i => {
    const isLow = i.currentStock <= i.criticalLevel;
    const stockPercent = i.criticalLevel > 0 ? Math.min((i.currentStock / i.criticalLevel) * 100, 100) : 100;
    return {
      ...i,
      isLowStock: isLow,
      statusLabel: isLow ? 'Low Stock' : 'Good',
      stockPercent
    };
  }).filter(i => i.isLowStock);

  // Top selling product (only from completed/valid orders in period)
  const productCounts: { [name: string]: { qty: number; revenue: number } } = {};
  periodTxns.forEach(t => {
    t.items.forEach(i => {
      if (!productCounts[i.productName]) {
        productCounts[i.productName] = { qty: 0, revenue: 0 };
      }
      productCounts[i.productName].qty += i.quantity;
      productCounts[i.productName].revenue += i.subtotal;
    });
  });

  const sortedTopProducts = Object.entries(productCounts)
    .map(([name, data]) => ({ productName: name, totalSold: data.qty, totalRevenue: data.revenue }))
    .sort((a, b) => b.totalSold - a.totalSold);

  const topSellingProduct = sortedTopProducts[0]?.productName || 'None';

  // Weekly sales trend (past 7 days) excluding voided orders
  const weeklySales = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = days[d.getDay()];

    const rev = validTransactions
      .filter(t => t.createdAt.startsWith(dateStr))
      .reduce((sum, t) => sum + t.totalAmount, 0);

    weeklySales.push({ dayLabel, revenue: rev });
  }

  res.json({
    todayRevenue,
    revenueGrowth: 12.5,
    todayTransactions,
    transactionGrowth: 8.3,
    topSellingProduct,
    lowStockCount: lowStockItems.length,
    weeklySales,
    lowStockItems,
    topProducts: sortedTopProducts.slice(0, 5)
  });
});

// Inventory Routes
app.get('/api/inventory', requireStaff, (req, res) => {
  const { category } = req.query;
  let list = inventory.filter(i => !i.isArchived);
  if (category && category !== 'all') {
    list = list.filter(i => (i.category || 'General').toLowerCase() === String(category).toLowerCase());
  }

  const enriched = list.map(i => {
    const isLow = i.currentStock <= i.criticalLevel;
    const stockPercent = i.criticalLevel > 0 ? Math.min((i.currentStock / i.criticalLevel) * 100, 100) : 100;
    const totalValue = i.currentStock * (i.unitCost || 0);
    return {
      ...i,
      category: i.category || 'General',
      unitCost: i.unitCost || 0,
      supplierName: i.supplierName || 'General Supplier',
      isLowStock: isLow,
      statusLabel: isLow ? 'Low Stock' : 'Good',
      stockPercent,
      totalValue
    };
  });

  res.json(enriched);
});

app.get('/api/inventory/logs', requireStaff, (req, res) => {
  const enriched = inventoryLogs.map(l => {
    const inv = inventory.find(i => i.id === l.inventoryItemId);
    return {
      ...l,
      itemName: inv?.name || 'Material Item',
      unit: inv?.unit || ''
    };
  });
  // Sort newest first
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(enriched);
});

app.post('/api/inventory/add-stock', requireStaff, (req, res) => {
  const { itemId, quantity, note, changeType } = req.body;
  const item = inventory.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

  const qty = Number(quantity);
  const type = changeType || 'stock_in'; // stock_in, stock_out, spoilage, set, set_exact

  const prevStock = item.currentStock;
  let changeAmt = 0;

  if (type === 'stock_in') {
    item.currentStock += qty;
    changeAmt = qty;
  } else if (type === 'set' || type === 'set_exact') {
    item.currentStock = Math.max(0, qty);
    changeAmt = item.currentStock - prevStock;
  } else {
    item.currentStock = Math.max(0, item.currentStock - qty);
    changeAmt = -qty;
  }

  item.updatedAt = new Date().toISOString();

  // Sync inventory stock update to Cloud SQL & Supabase
  syncInventoryUpdateToCloudSql(item.id, item.currentStock).catch(err => console.error('Cloud SQL inv sync error:', err));
  syncInventoryUpdateToSupabase(item.id, item.currentStock).catch(err => console.error('Supabase inv sync error:', err));

  const staffUser = getStaffUserFromRequest(req);
  inventoryLogs.push({
    id: `log-${Date.now()}`,
    inventoryItemId: item.id,
    changeType: type,
    quantityChange: changeAmt,
    note: note || (type === 'spoilage' ? 'Spoilage / Damaged Material' : (type === 'set' || type === 'set_exact' ? `Count calibrated to ${item.currentStock} ${item.unit}` : 'Stock Adjustment')),
    performedBy: staffUser?.fullName || 'Manager',
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, newStock: item.currentStock });
});

app.post('/api/inventory/create', requireStaff, (req, res) => {
  const staffUser = getStaffUserFromRequest(req);
  const { name, unit, currentStock, criticalLevel, category, unitCost, supplierName } = req.body;
  const newItem: InventoryRecord = {
    id: `inv-${Date.now()}`,
    name,
    unit: unit || 'pcs',
    currentStock: Number(currentStock) || 0,
    criticalLevel: Number(criticalLevel) || 10,
    category: category || 'General',
    unitCost: Number(unitCost) || 0,
    supplierName: supplierName || 'Local Supplier',
    updatedAt: new Date().toISOString()
  };
  inventory.push(newItem);

  // Sync to Supabase
  (async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('./src/lib/supabase.ts');
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('inventory').insert({
          id: newItem.id,
          name: newItem.name,
          category: newItem.category,
          unit: newItem.unit,
          unit_cost: newItem.unitCost,
          current_stock: newItem.currentStock,
          critical_level: newItem.criticalLevel,
          supplier_name: newItem.supplierName,
          is_archived: false,
          created_at: newItem.updatedAt,
          updated_at: newItem.updatedAt
        });
      }
    } catch (err) {
      console.error('Supabase inventory insert error:', err);
    }
  })();

  // Initial stock-in log
  if (newItem.currentStock > 0) {
    inventoryLogs.push({
      id: `log-${Date.now()}`,
      inventoryItemId: newItem.id,
      changeType: 'stock_in',
      quantityChange: newItem.currentStock,
      note: 'Initial Material Stock Setup',
      performedBy: staffUser?.fullName || 'Manager',
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, item: newItem });
});

app.put('/api/inventory/:id', requireStaff, (req, res) => {
  const { id } = req.params;
  const item = inventory.find(i => i.id === id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

  const { name, unit, currentStock, criticalLevel, category, unitCost, supplierName } = req.body;
  item.name = name ?? item.name;
  item.unit = unit ?? item.unit;
  item.currentStock = currentStock !== undefined ? Number(currentStock) : item.currentStock;
  item.criticalLevel = criticalLevel !== undefined ? Number(criticalLevel) : item.criticalLevel;
  item.category = category ?? item.category;
  item.unitCost = unitCost !== undefined ? Number(unitCost) : item.unitCost;
  item.supplierName = supplierName ?? item.supplierName;
  item.updatedAt = new Date().toISOString();

  // Sync inventory stock update to Cloud SQL
  syncInventoryUpdateToCloudSql(item.id, item.currentStock).catch(err => console.error('Cloud SQL inv sync error:', err));
  
  // Sync inventory updates to Supabase
  (async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('./src/lib/supabase.ts');
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('inventory').update({
          name: item.name,
          category: item.category,
          unit: item.unit,
          unit_cost: item.unitCost,
          current_stock: item.currentStock,
          critical_level: item.criticalLevel,
          supplier_name: item.supplierName,
          updated_at: item.updatedAt
        }).eq('id', item.id);
      }
    } catch (err) {
      console.error('Supabase inventory update error:', err);
    }
  })();

  res.json({ success: true, item });
});

app.delete('/api/inventory/:id', requireStaff, (req, res) => {
  const { id } = req.params;
  const item = inventory.find(i => i.id === id);
  if (item) {
    item.isArchived = true;
  }
  res.json({ success: true });
});

// Reports Routes
app.get('/api/reports/transactions', requireStaff, (req, res) => {
  const { from, to } = req.query;

  let filtered = [...transactions];
  if (from) {
    filtered = filtered.filter(t => t.createdAt >= String(from));
  }
  if (to) {
    const toEnd = `${to}T23:59:59.999Z`;
    filtered = filtered.filter(t => t.createdAt <= toEnd);
  }

  res.json(filtered);
});

// Void Transaction / Cancel punched order endpoint
app.post('/api/reports/transactions/:id/void', requireStaff, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const tx = transactions.find(t => t.id === id || t.transactionRef === id);
  if (!tx) {
    return res.status(404).json({ success: false, message: 'Transaction record not found.' });
  }

  if (tx.status === 'Voided' || tx.status === 'void') {
    return res.status(400).json({ success: false, message: 'This transaction is already voided.' });
  }

  const staffUser = getStaffUserFromRequest(req);

  // Mark transaction status as Voided
  tx.status = 'Voided';
  tx.voidedAt = new Date().toISOString();
  tx.voidedBy = staffUser?.fullName || 'Manager / Cashier';
  tx.voidReason = reason || 'Customer Cancellation / POS Correction';

  // Restore inventory stock based on recipes for each item in the order
  restoreInventoryForOrder(tx.items, tx.transactionRef, tx.voidedBy || 'Manager / Cashier');

  // Sync void status to Supabase
  syncVoidTransactionToSupabase(tx.id, tx.voidReason, tx.transactionRef).catch(err => console.error('Supabase void tx sync error:', err));

  res.json({
    success: true,
    message: `Transaction ${tx.transactionRef} has been voided successfully. Dashboard sales analytics updated and ingredient inventory restored.`
  });
});

// Archive Routes
app.get('/api/archive', requireAdmin, (req, res) => {
  const archivedProds = products.filter(p => !p.isAvailable);
  const archivedUsers = users.filter(u => !u.isActive);
  const archivedInv = inventory.filter(i => i.isArchived);
  res.json({
    archivedProducts: archivedProds,
    archivedUsers: archivedUsers.map(u => ({ id: u.id, fullName: u.fullName, username: u.username, role: u.role, createdAt: u.createdAt })),
    archivedInventory: archivedInv
  });
});

app.post('/api/archive/restore-product/:id', requireAdmin, (req, res) => {
  const p = products.find(p => p.id === req.params.id);
  if (p) {
    p.isAvailable = true;
    syncProductAvailabilityToSupabase(p.id, true).catch(err => console.error('Supabase restore prod error:', err));
  }
  res.json({ success: true });
});

app.post('/api/archive/restore-user/:id', requireAdmin, (req, res) => {
  const u = users.find(u => u.id === req.params.id);
  if (u) {
    u.isActive = true;
    syncUserToSupabase(u).catch(err => console.error('Supabase restore user error:', err));
  }
  res.json({ success: true });
});

app.post('/api/archive/restore-inventory/:id', requireAdmin, (req, res) => {
  const i = inventory.find(inv => inv.id === req.params.id);
  if (i) {
    i.isArchived = false;
    syncInventoryUpdateToSupabase(i.id, i.currentStock).catch(err => console.error('Supabase restore inv error:', err));
  }
  res.json({ success: true });
});

// User Settings Management
app.get('/api/users', requireAdmin, (req, res) => {
  res.json(users.map(u => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    email: u.email || '',
    phone: u.phone || '',
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt
  })));
});

app.post('/api/users/create', requireAdmin, (req, res) => {
  const { fullName, username, password, role, contactNumber, phone, email } = req.body;
  if (!fullName || !username || !password) {
    return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
  }

  const existing = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username is already taken.' });
  }

  const resolvedPhone = (phone || contactNumber || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  // If email is provided, verify OTP status
  if (cleanEmail) {
    const existingEmailStaff = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    const existingEmailCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
    if (existingEmailStaff || existingEmailCust) {
      return res.status(400).json({ success: false, message: 'Email is already used' });
    }

    const otpEntry = emailOtpStore.get(cleanEmail);
    if (!otpEntry || !otpEntry.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify the staff Gmail address via OTP before creating the user.'
      });
    }
  }

  // CommonBrew has strictly only 1 Administrator; new staff members are always Cashiers
  const newUser: UserRecord = {
    id: `u-${Date.now()}`,
    fullName: fullName.trim(),
    username: username.trim(),
    email: cleanEmail || undefined,
    phone: resolvedPhone || undefined,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'Cashier',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  syncUserToSupabase(newUser).catch(err => console.error('Supabase staff creation sync error:', err));
  res.json({ success: true, user: newUser });
});

// Update Staff User Details (Edit Staff)
app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { fullName, username, role, phone, contactNumber, email, password } = req.body;
  const u = users.find(user => user.id === req.params.id);
  if (!u) {
    return res.status(404).json({ success: false, message: 'Staff user not found.' });
  }

  const resolvedPhone = (phone !== undefined ? phone : contactNumber);
  const cleanEmail = (email !== undefined ? email.trim().toLowerCase() : undefined);

  if (username && username.trim().toLowerCase() !== u.username.toLowerCase()) {
    const existing = users.find(user => user.id !== u.id && user.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username is already taken by another user.' });
    }
    u.username = username.trim();
  }

  if (cleanEmail !== undefined) {
    if (cleanEmail && cleanEmail !== (u.email || '').toLowerCase()) {
      const existingEmailStaff = users.find(user => user.id !== u.id && user.email && user.email.toLowerCase() === cleanEmail);
      const existingEmailCust = customers.find(c => c.email && c.email.toLowerCase() === cleanEmail);
      if (existingEmailStaff || existingEmailCust) {
        return res.status(400).json({ success: false, message: 'Email is already used' });
      }

      // Check OTP verification for the new email address
      const otpEntry = emailOtpStore.get(cleanEmail);
      if (!otpEntry || !otpEntry.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify the new Gmail address via 6-digit OTP code before saving changes.'
        });
      }

      u.email = cleanEmail;
    } else if (cleanEmail === '') {
      u.email = undefined;
    }
  }

  if (fullName && fullName.trim()) {
    u.fullName = fullName.trim();
  }

  if (resolvedPhone !== undefined) {
    const trimmedPhone = resolvedPhone.trim();
    u.phone = trimmedPhone || undefined;
  }

  // Only the original Administrator can retain the Administrator role; cashiers cannot be promoted to admin
  if (role && u.role !== 'Administrator' && role === 'Administrator') {
    return res.status(400).json({ success: false, message: 'CommonBrew has only 1 Administrator account. Additional administrators cannot be created.' });
  }

  if (password && password.trim().length > 0) {
    u.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  // Sync updated staff user to Supabase
  syncUserToSupabase(u).catch(err => console.error('Supabase staff update sync error:', err));

  res.json({
    success: true,
    message: 'Staff member updated successfully.',
    user: {
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive
    }
  });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const u = users.find(u => u.id === req.params.id);
  if (!u) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  if (u.role === 'Administrator') {
    return res.status(403).json({ success: false, message: 'The primary Administrator account cannot be deactivated.' });
  }
  u.isActive = false;
  revokeStaffSessionsForUser(u.id);
  // Push to every connected device so the deactivated cashier is signed out immediately
  broadcastRealtimeEvent({ table: 'staff_sessions', eventType: 'REVOKED', new: { userId: u.id, reason: 'account_deactivated' } });
  syncUserToSupabase(u).catch(err => console.error('Supabase staff deactivate sync error:', err));
  res.json({ success: true, message: 'Staff member deactivated successfully.' });
});

app.post('/api/users/:id/reactivate', requireAdmin, (req, res) => {
  const u = users.find(u => u.id === req.params.id);
  if (!u) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  u.isActive = true;
  syncUserToSupabase(u).catch(err => console.error('Supabase staff reactivate sync error:', err));
  res.json({ success: true, message: 'Staff member reactivated successfully.' });
});

app.post('/api/users/:id/change-password', requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  const u = users.find(u => u.id === req.params.id);
  if (u && newPassword) {
    u.passwordHash = bcrypt.hashSync(newPassword, 10);
    syncPasswordToSupabase(u.id, u.passwordHash).catch(err => console.error('Supabase staff password change sync error:', err));
  }
  res.json({ success: true });
});

// Reusable multi-model AI Chat Helper using exclusively Gemini API
async function generateAIChatResponse(
  systemPrompt: string,
  convoHistory: any[],
  question: string,
  dynamicFallbackReply: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY || '';

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Build multi-turn contents for Gemini
      const contents: any[] = [];
      for (const msg of convoHistory.slice(-8)) {
        const role = (msg.role === 'assistant' || msg.role === 'bot' || msg.sender === 'bot') ? 'model' : 'user';
        const text = msg.content || msg.text || '';
        if (text) {
          contents.push({ role, parts: [{ text }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: question }] });

      // Supported Gemini models from @google/genai
      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash'
      ];

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7
            }
          });

          if (response?.text) {
            return response.text;
          }
        } catch (mErr: any) {
          console.warn(`[CommonBot AI] Gemini model ${model} issue (${mErr?.message || mErr}). Trying next candidate model...`);
        }
      }
    } catch (geminiErr) {
      console.warn('[CommonBot AI] Gemini service error:', geminiErr);
    }
  }

  // Return dynamic context-aware fallback if Gemini is unreachable
  return dynamicFallbackReply;
}

// AI Chatbot Route (CommonBot POS & Staff Assistant - Resilient Multi-Turn Support)
app.post('/api/chatbot/ask', chatbotLimiter, requireStaff, async (req, res) => {
  const { question, history, messages: reqMessages } = req.body;
  const staffUser = getStaffUserFromRequest(req);
  const userName = staffUser?.fullName || 'Barista / Admin';

  try {
    const menuSummary = products.filter(p => p.isAvailable).map(p => `- ${p.name}: ₱${p.price} (${p.productType})`).join('\n');
    const invSummary = inventory.map(i => `- ${i.name}: ${i.currentStock} ${i.unit} (Critical Level: ${i.criticalLevel})`).join('\n');
    const recentTxns = transactions.slice(0, 10).map(t => `- ${t.transactionRef}: ₱${t.totalAmount} (${t.paymentMethod}) - Status: ${t.status}`).join('\n');
    const activeOnlineOrdersSummary = onlineOrders.slice(0, 10).map(o => `- Order #${o.orderRef} (${o.customerName}, ${o.orderType}): Status = ${o.status}, Address = ${o.deliveryAddress || 'Storefront'}, Total = ₱${o.totalAmount}`).join('\n') || 'None';

    const validTxns = transactions.filter(t => t.status !== 'Voided' && t.status !== 'void');
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = validTxns.filter(t => t.createdAt.startsWith(todayStr)).reduce((sum, t) => sum + t.totalAmount, 0);

    const systemPrompt = `You are CommonBot, an advanced, highly intelligent AI assistant for CommonBrew Taytay POS — designed to respond with the exact intelligence, eloquence, depth, and helpfulness of ChatGPT.

You are an expert on coffee brewing science, barista techniques, cafe management, inventory optimization, sales analysis, customer service, and general world knowledge (business, math, writing, technology, creative ideas, etc.).

CONVERSATION & RESPONSE STYLE (LIKE CHATGPT):
1. **Articulate, Insightful & Engaging**: Provide comprehensive, thoughtful, clear, and well-reasoned answers just like ChatGPT.
2. **Markdown Formatting**: Use clean markdown formatting (e.g. bold key terms, clear bullet points, numbered lists, subheadings ###, and tables when comparing data).
3. **Versatile Knowledge**: You can answer ANY question the user asks — from cafe operations and product comparisons to general knowledge, coffee history, recipes, math, coding, staff tips, or friendly conversational banter.
4. **Live POS Grounding**: When discussing CommonBrew Taytay, seamlessly reference the live database provided below with exact figures in Philippine Peso (₱).
5. **No Monotonous Scripts**: Speak naturally. Do not repeat robotic introductory greetings on every single turn. Address the user respectfully as ${userName}.

LIVE SYSTEM DATABASE:
[CURRENT ACTIVE PRODUCTS]
${menuSummary}

[INVENTORY & STOCK LEVELS]
${invSummary}

[TODAY'S SALES METRICS]
- Today's Total Sales: ₱${todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
- Total Completed Transactions: ${validTxns.length}

[ONLINE & DELIVERY ORDERS]
${activeOnlineOrdersSummary}

[RECENT TRANSACTIONS]
${recentTxns}`;

    const convoHistory = Array.isArray(history) ? history : (Array.isArray(reqMessages) ? reqMessages : []);
    const lowStock = inventory.filter(i => i.currentStock <= i.criticalLevel);

    const dynamicFallback = `### Hello ${userName}! ☕\n\nI am **CommonBot**, your AI Assistant for CommonBrew Taytay. Here is a live overview of the store:\n\n- **Today's Total Sales**: ₱${todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n- **Active Available Products**: ${products.filter(p => p.isAvailable).length} menu items\n- **Low Stock Ingredients**: ${lowStock.length > 0 ? lowStock.map(i => `**${i.name}** (${i.currentStock} ${i.unit} left)`).join(', ') : 'All ingredients are well-stocked'}\n- **Active Online Orders**: ${onlineOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length} orders in progress\n\nFeel free to ask me any questions about our sales, product performance, recipes, or inventory!`;

    const reply = await generateAIChatResponse(systemPrompt, convoHistory, question, dynamicFallback);
    return res.json({ reply });
  } catch (err: any) {
    console.error('Chatbot error:', err);
    res.json({ reply: `I'm here to help! You can ask me anything about CommonBrew Taytay's sales, menu, stock levels, orders, or general coffee brewing questions.` });
  }
});

// Helper function to validate if a customer question is related to CommonBrew Taytay and allowed topics
function evaluateCustomerChatbotScope(query: string): { isAllowed: boolean; category: 'customer_status' | 'order_status' | 'loyalty_status' | 'best_sellers' | 'brewing_tips' | 'general_inquiries' | 'greeting' | 'out_of_scope' } {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return { isAllowed: true, category: 'greeting' };

  // Conversational greetings & pleasantries
  const greetingsPattern = /^(hi|hello|hey|good\s+(morning|afternoon|evening|day)|kamusta|musta|greetings|who\s+are\s+you|what\s+can\s+you\s+do|help|salamat|thank\s*you|thanks|bye|goodbye)[\s!.,?]*$/i;
  if (greetingsPattern.test(clean)) {
    return { isAllowed: true, category: 'greeting' };
  }

  // 1. Explicit Out-of-Scope Patterns (strictly rejected)
  const outOfScopePatterns = [
    /\b(python|javascript|typescript|c\+\+|java|html|css|php|rust|golang|sql\s+query|coding|programming|write\s+a?\s*code|debug\s+code|react|github|docker|linux|bash)\b/i,
    /\b(calculate|integral|derivative|algebra|solve\s+for\s+x|quadratic|solve\s+\d+|math\s+problem|equation)\b/i,
    /\b(politics|president|election|senate|congress|democrat|republican|war\s+in|prime\s+minister|geopolitics)\b/i,
    /\b(nba|pba|fifa|basketball|football|soccer|champions\s+league|world\s+cup|super\s+bowl|lakers|warriors)\b/i,
    /\b(celebrity|hollywood|movie\s+plot|netflix\s+show|actor|actress|taylor\s+swift|k-pop|bts|anime|manga)\b/i,
    /\b(write\s+(an?\s+)?(essay|poem|song|story|novel|thesis|homework)|do\s+my\s+homework)\b/i,
    /\b(crypto|bitcoin|ethereum|forex|stock\s+market|investing\s+advice|legal\s+advice|medical\s+advice|diagnose)\b/i,
    /\b(who\s+is\s+(the\s+)?(president|king|queen|governor|mayor)\s+of)\b/i,
    /\b(capital\s+of\s+[a-z]+|distance\s+to\s+(the\s+)?(moon|sun|mars)|speed\s+of\s+light)\b/i,
    /\b(starbucks|tim\s+hortons|dunkin|jollibee|mcdonalds|kfc)\b/i
  ];

  for (const pattern of outOfScopePatterns) {
    if (pattern.test(clean)) {
      return { isAllowed: false, category: 'out_of_scope' };
    }
  }

  // 2. Identify in-scope categories
  const greetingsKeywords = [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'who are you',
    'what is commonbrew', 'what can you do', 'help', 'commonbot', 'sup', 'yo', 'kamusta', 'kumusta'
  ];

  const customerStatusKeywords = [
    'customer status', 'my status', 'profile', 'my account', 'my profile', 'my details', 'my info',
    'who am i', 'my address', 'delivery address', 'my phone', 'my email', 'saved address', 'customer info'
  ];

  const orderStatusKeywords = [
    'order status', 'my order', 'track order', 'tracking', 'arrival', 'arrive', 'eta', 'delivery time',
    'pending', 'preparing', 'ready for pickup', 'dispatched', 'rider', 'when will my order', 'where is my order',
    'order history', 'order details', 'order #', 'order ref'
  ];

  const loyaltyStatusKeywords = [
    'loyalty', 'loyalty points', 'loyalty balance', 'my points', 'point status', 'pts', 'redeem points',
    'redemption', 'loyalty reward', '100 points', '5 points', '110 discount', 'free upsized drink', 'loyalty discount'
  ];

  const bestSellersKeywords = [
    'best seller', 'bestseller', 'best-seller', 'top 10', 'top 5', 'popular', 'recommend', 'recommendation',
    'menu', 'available drink', 'available food', 'signature', 'drink', 'pastry', 'pastries', 'muffin',
    'croissant', 'cookie', 'spanish latte', 'sea salt', 'caramel macchiato', 'matcha', 'frappe',
    'fruit tea', 'soda', 'price', 'pricing', 'add-on', 'addon', 'in stock', 'out of stock'
  ];

  const brewingTipsKeywords = [
    'brew', 'brewing', 'brewing tips', 'coffee tips', 'barista', 'espresso', 'pour over', 'pourover',
    'v60', 'french press', 'aeropress', 'cold brew', 'grind', 'grinder', 'roast', 'roasting', 'beans',
    'arabica', 'robusta', 'liberica', 'caffeine', 'decaf', 'water temp', 'temperature', 'ratio',
    'recipe', 'extraction', 'tasting notes', 'flavor notes', 'crema', 'milk steaming', 'froth', 'pairing'
  ];

  const generalInquiriesKeywords = [
    'commonbrew', 'taytay', 'hour', 'hours', 'open', 'close', 'opening time', 'closing time',
    'location', 'where are you', 'address', 'manila east', 'san juan', 'contact', 'phone number',
    'email', 'payment', 'payment method', 'gcash', 'cash', 'cod', 'delivery fee', 'wifi', 'dine-in', 'takeout', 'pickup'
  ];

  if (greetingsKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'greeting' };
  if (customerStatusKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'customer_status' };
  if (orderStatusKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'order_status' };
  if (loyaltyStatusKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'loyalty_status' };
  if (bestSellersKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'best_sellers' };
  if (brewingTipsKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'brewing_tips' };
  if (generalInquiriesKeywords.some(k => clean.includes(k))) return { isAllowed: true, category: 'general_inquiries' };

  // General coffee / cafe / food mention fallback check
  const coffeeCafeKeywords = ['coffee', 'cafe', 'drink', 'brew', 'cup', 'beans', 'latte', 'tea', 'milk', 'sugar', 'ice', 'order', 'food', 'snack', 'pastry'];
  if (coffeeCafeKeywords.some(k => clean.includes(k))) {
    return { isAllowed: true, category: 'general_inquiries' };
  }

  // Not matching any allowed CommonBrew or coffee topic
  return { isAllowed: false, category: 'out_of_scope' };
}

// Customer-Facing AI Chatbot Route (Answers all prompts like ChatGPT, handles off-topic by recommending Top 5 Best Sellers)
app.post('/api/customer-chatbot/ask', chatbotLimiter, async (req, res) => {
  const { question, customerId, customerName, history, messages: reqMessages } = req.body;
  
  // Resolve current logged-in customer info
  let activeCust = getCustomerFromRequest(req);
  if (!activeCust && customerId) {
    activeCust = customers.find(c => c.id === customerId) || null;
  }
  
  const custName = activeCust?.fullName || customerName || 'Valued Guest';
  const custPoints = activeCust?.loyaltyPoints || 0;

  // Scope evaluation helper to guide fallback responses
  const scopeEvaluation = evaluateCustomerChatbotScope(question);

  try {
    // 1. Analyze Top 10 Best-Selling Products from database
    const productSalesMap: { [name: string]: { qty: number; revenue: number } } = {};
    
    transactions.filter(t => t.status !== 'Voided' && t.status !== 'void').forEach(t => {
      t.items.forEach(i => {
        if (!productSalesMap[i.productName]) {
          productSalesMap[i.productName] = { qty: 0, revenue: 0 };
        }
        productSalesMap[i.productName].qty += i.quantity;
        productSalesMap[i.productName].revenue += i.subtotal;
      });
    });

    onlineOrders.forEach(o => {
      o.items.forEach(i => {
        if (!productSalesMap[i.productName]) {
          productSalesMap[i.productName] = { qty: 0, revenue: 0 };
        }
        productSalesMap[i.productName].qty += i.quantity;
        productSalesMap[i.productName].revenue += i.subtotal;
      });
    });

    const top10Products = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, qtySold: data.qty, totalRevenue: data.revenue }))
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 10);

    const top10Text = top10Products.length > 0
      ? top10Products.map((p, idx) => `${idx + 1}. **${p.name}** (${p.qtySold} sold)`).join('\n')
      : '1. **Iced Spanish Latte**\n2. **Sea Salt Latte**\n3. **Belgian Choco Muffin**\n4. **Caramel Macchiato**\n5. **Matcha Green Tea Latte**';

    // Top 5 Best Sellers for off-topic recommendations
    const top5BestSellers = [
      { name: 'Iced Spanish Latte', price: 150, desc: 'Our #1 best-seller! Rich espresso blended with sweet, creamy condensed milk' },
      { name: 'Sea Salt Latte', price: 150, desc: 'Bold iced espresso crowned with our signature savory sea salt cream foam' },
      { name: 'Belgian Choco Muffin', price: 85, desc: 'Decadent, warm dark chocolate muffin loaded with rich cocoa' },
      { name: 'Caramel Macchiato', price: 155, desc: 'Layered vanilla milk, rich espresso, and buttery caramel drizzle' },
      { name: 'Matcha Green Tea Latte', price: 150, desc: 'Ceremonial Japanese matcha whisked with fresh, creamy milk' }
    ];
    const top5Text = top5BestSellers.map((p, idx) => `${idx + 1}. ☕ **${p.name}** (₱${p.price}) - ${p.desc}`).join('\n');

    // 2. Analyze Available Products and Remaining Ingredients
    const menuList = products.filter(p => !p.isArchived).map(p => {
      return `- **${p.name}** (₱${p.price}, ${p.productType}): ${p.isAvailable ? '✅ In Stock' : '❌ Out of Stock'}`;
    }).join('\n');

    const lowStockIngredients = inventory
      .filter(i => !i.isArchived && i.currentStock <= i.criticalLevel)
      .map(i => `- ${i.name}: ${i.currentStock} ${i.unit} left (CRITICAL LEVEL)`)
      .join('\n');

    const inventoryStatusNote = lowStockIngredients
      ? `NOTE ON INGREDIENT CONSTRAINTS:\nThe following raw ingredients are currently low in inventory:\n${lowStockIngredients}`
      : 'All raw ingredients are healthy and well-stocked in inventory.';

    // 3. Customer Status & Profile Summary
    const customerStatusSummary = activeCust ? `
- Full Name: ${activeCust.fullName}
- Username: @${activeCust.username}
- Registered Email: ${activeCust.email}
- Contact Phone: ${activeCust.phone || 'Not provided'}
- Registered Delivery Address: ${activeCust.address || 'Not set'}
- Loyalty Points Balance: ${activeCust.loyaltyPoints} points (${activeCust.loyaltyPoints >= 100 ? 'Eligible for ₱110 discount!' : `${100 - (activeCust.loyaltyPoints % 100)} more pts needed for next ₱110 discount`})
- Account Created: ${new Date(activeCust.createdAt).toLocaleDateString()}
` : `Customer is currently browsing as Guest (${custName}). Remind them to sign in or register to view their personalized account profile and earn loyalty points.`;

    // 4. Loyalty Points Status & Detailed Rules
    const loyaltyPointsSummary = `
- Current Customer Balance: ${custPoints} loyalty points.
- Earning Rate: 5 points for every ₱50 spent on all online and in-store orders.
- Redemption Rule: Every 100 loyalty points can be redeemed during checkout for an instant ₱110 discount (equivalent to 1 free upsized 22oz drink!).
- Balance Retention: Redeeming only deducts 100 points, so any extra points (for example, 105 - 100 = 5 points) remain safely in the customer's balance.
- How to Redeem: In the Online Order Checkout modal, right under the Payment Method section, click the checkbox button "Use Loyalty Points ${custPoints}/100".
`;

    // 5. Store General Inquiries Grounding
    const generalInquiriesSummary = `
- Cafe Name: CommonBrew Taytay
- Physical Location: 143 Manila East Road, Brgy. San Juan, Taytay, Rizal (Near Club Manila East)
- Operating Hours: 7:00 AM – 10:00 PM Daily (Monday through Sunday)
- Contact Number: +63 917 123 4567 | +63 947 496 0778
- Official Email: commonbrewtaytay@gmail.com
- Service Options: Online Ordering for Delivery in Taytay (₱45 delivery fee), Store Pickup (Free), and Dine-In
- Payment Methods Accepted: GCash (Official GCash Account: 09474960778 - CommonBrew Taytay), Cash on Pickup, Cash on Delivery
`;

    // 6. Brewing & Coffee Tips Grounding
    const brewingTipsSummary = `
- Coffee Beans & Sourcing: Premium Arabica and Robusta beans, medium-dark roasted for maximum richness and low acidity.
- Popular Espresso Drinks:
  * Spanish Latte: Rich espresso, velvety milk, and sweet condensed milk (Top 1 Best Seller).
  * Sea Salt Latte: Smooth iced espresso and milk crowned with signature savory sea salt cream foam.
  * Caramel Macchiato: Layered vanilla milk, rich espresso shots, and buttery caramel drizzle.
- Home Brewing Tips:
  * Pour-Over (V60): 1:15 to 1:16 coffee-to-water ratio, medium grind, 92-94°C water.
  * French Press: Coarse grind, 1:12 to 1:14 ratio, 4 minutes steep time.
  * Cold Brew: Coarse grind, 1:8 concentrate ratio, steeped for 16-18 hours in the fridge for a silky, smooth, chocolatey profile with low acidity.
  * Espresso: Fine grind, 1:2 extraction ratio in 25-30 seconds.
- Caffeine Content: Single espresso shot (~65mg), Double shot in 16oz drinks (~130mg), 22oz upsized drinks (~195mg).
- Food & Pastry Pairings: Iced Spanish Latte pairs exceptionally with the Belgian Choco Muffin or Butter Croissant.
`;

    // 7. Analyze Customer Active & Recent Online Orders for Delivery/Arrival Time Estimation
    const myOnlineOrders = onlineOrders.filter(o => {
      if (activeCust && o.customerId === activeCust.id) return true;
      if (activeCust?.email && o.customerEmail && o.customerEmail.toLowerCase() === activeCust.email.toLowerCase()) return true;
      if (customerName && o.customerName.toLowerCase().includes(customerName.toLowerCase())) return true;
      return false;
    });

    const nowMs = Date.now();
    let activeOrdersSummary = 'No active or past orders found for this customer account.';

    if (myOnlineOrders.length > 0) {
      activeOrdersSummary = myOnlineOrders.slice(0, 5).map(o => {
        const orderTime = new Date(o.createdAt);
        const orderAgeMins = Math.max(0, Math.floor((nowMs - orderTime.getTime()) / (1000 * 60)));
        
        let etaText = '';
        if (o.status === 'Pending') {
          if (o.orderType === 'Delivery') {
            const minLeft = Math.max(10, 35 - orderAgeMins);
            const maxLeft = Math.max(15, 45 - orderAgeMins);
            const arrivalTime = new Date(nowMs + minLeft * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            etaText = `Pending confirmation. Estimated arrival at ${o.deliveryAddress || 'your address'}: around ${arrivalTime} (approx. ${minLeft}-${maxLeft} mins).`;
          } else {
            const minLeft = Math.max(5, 15 - orderAgeMins);
            etaText = `Pending confirmation. Estimated pickup ready time: in approx. ${minLeft} mins.`;
          }
        } else if (o.status === 'Preparing') {
          if (o.orderType === 'Delivery') {
            const minLeft = Math.max(8, 20 - orderAgeMins);
            const maxLeft = Math.max(15, 30 - orderAgeMins);
            const arrivalTime = new Date(nowMs + minLeft * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            etaText = `Freshly brewing & preparing in kitchen! Estimated arrival at ${o.deliveryAddress || 'your address'}: around ${arrivalTime} (approx. ${minLeft}-${maxLeft} mins).`;
          } else {
            const minLeft = Math.max(3, 10 - orderAgeMins);
            etaText = `Freshly brewing in kitchen! Estimated pickup ready time: in approx. ${minLeft} mins.`;
          }
        } else if (o.status === 'Ready') {
          if (o.orderType === 'Delivery') {
            const minLeft = Math.max(5, 12 - orderAgeMins);
            const arrivalTime = new Date(nowMs + minLeft * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            etaText = `DISPATCHED & ON THE WAY! Delivery rider is heading to ${o.deliveryAddress || 'your address'}. Estimated arrival: around ${arrivalTime} (within 5-15 mins).`;
          } else {
            etaText = `READY for pickup at our Taytay counter right now!`;
          }
        } else if (o.status === 'Completed') {
          etaText = `Completed and delivered successfully.`;
        } else if (o.status === 'Cancelled') {
          etaText = `Order was cancelled.`;
        }

        const itemsList = o.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');

        return `- Order #${o.orderRef} (${o.orderType}): Status = ${o.status}\n  Items: ${itemsList}\n  Total: ₱${o.totalAmount}\n  Delivery Address: ${o.deliveryAddress || 'Store Pickup'}\n  Placed: ${orderAgeMins < 60 ? `${orderAgeMins} mins ago` : orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n  Estimated Arrival / Status Details: ${etaText}`;
      }).join('\n\n');
    }

    const systemPrompt = `You are CommonBot, the official intelligent AI assistant for CommonBrew Taytay.
You must answer like ChatGPT: speak naturally, warmly, intelligently, conversationally, and engagingly. Never sound stiff, robotic, or scripted.

YOUR ROLE & TOPICS:
CommonBrew Taytay cafe, artisan coffee craftsmanship, and customer online ordering information:
1. **Customer Status**: Account profile, username, verified phone/email, and registered delivery address.
2. **Order Status**: Live order tracking, items, preparation stage, delivery rider tracking, pickup readiness, and arrival ETA.
3. **Loyalty Points Status**: Points balance, earning rate (5 pts per ₱50 spent), and ₱110 reward redemption (100 pts = ₱110 discount, extra points remain in balance).
4. **Best Sellers & Menu**: Top 10 drinks and pastries, pricing, customizations, add-ons, and availability.
5. **Brewing & Coffee Tips**: Coffee beans (Arabica & Robusta), brewing methods (pour-over, cold brew, French press, espresso), roast profiles, caffeine content, and food pairings.
6. **General Store Inquiries**: Operating hours (7:00 AM – 10:00 PM Daily), address (143 Manila East Road, Brgy. San Juan, Taytay, Rizal near Club Manila East), contact numbers, and payment options (GCash, Cash on Pickup, Cash on Delivery).

MANDATORY USER PROMPT POLICY (CHATGPT-STYLE):
- CommonBot MUST respond with a helpful, conversational message to ALL prompts in the chatbot.
- When answering on-topic questions about CommonBrew Taytay (customer status, online order tracking, delivery arrival time/ETA, loyalty points status, menu, best sellers, brewing & coffee tips, store location & hours, friendly greetings):
  Answer thoroughly, warmly, and helpfully like ChatGPT, formatted cleanly with Markdown (bullet points, bold text, readable spacing).
- BUT when the user prompts an off-topic question and not about CommonBrew customers online ordering information (for example: programming/coding, math equations, school homework, politics, sports, entertainment/celebrities, other stores, or unrelated trivia):
  You MUST say that you cannot answer that and ask them to please ask about CommonBrew Taytay, AND YOU MUST RECOMMEND OUR TOP 5 BEST-SELLING PRODUCTS!
  Use this friendly, ChatGPT-style response format for off-topic prompts:
  "I apologize, but I cannot answer that question as I can only assist with inquiries regarding CommonBrew Taytay and our customer online ordering information. Please feel free to ask me anything about CommonBrew Taytay! ☕
  
  In the meantime, let me recommend our **Top 5 Best-Selling Products** that our customers love:
  ${top5Text}
  
  Would you like to check your customer status, track an active order, view your loyalty points balance, or try one of our best-sellers?"

RESPONSE GUIDELINES:
- Always format your responses using clean Markdown with bolding, lists, and headings for maximum readability.
- Always use Philippine Peso (₱).
- Speak warmly, politely, and hospitably.

LIVE STORE & ORDER DATA:
[TOPIC 1: CUSTOMER STATUS & PROFILE]
${customerStatusSummary}

[TOPIC 2: LIVE ORDER STATUS & ESTIMATED ARRIVAL TIMES]
${activeOrdersSummary}

[TOPIC 3: LOYALTY POINTS STATUS & RULES]
${loyaltyPointsSummary}

[TOPIC 4: TOP 10 BEST SELLERS & MENU RECOMMENDATIONS]
${top10Text}

[TOP 5 BEST SELLERS FOR OFF-TOPIC RECOMMENDATIONS]
${top5Text}

[AVAILABLE MENU & PRICING]
${menuList}

[INVENTORY NOTES]
${inventoryStatusNote}

[TOPIC 5: BREWING & COFFEE TIPS]
${brewingTipsSummary}

[TOPIC 6: GENERAL INQUIRIES: HOURS, LOCATION, CONTACT, PAYMENTS]
${generalInquiriesSummary}`;

    const convoHistory = Array.isArray(history) ? history : (Array.isArray(reqMessages) ? reqMessages : []);

    // Tailored dynamic fallback based on category (used if AI service is temporarily unreachable)
    let dynamicFallback = `### Hello ${custName}! ☕\n\nI am **CommonBot**, your AI assistant for **CommonBrew Taytay**! Here is your quick store overview:\n\n- 👤 **Customer Status**: ${activeCust ? `Logged in as ${activeCust.fullName} (@${activeCust.username}) • Address: ${activeCust.address || 'Taytay'}` : 'Guest'}\n- 📦 **Order Status**: ${myOnlineOrders.length > 0 ? `Order #${myOnlineOrders[0].orderRef} is ${myOnlineOrders[0].status}` : 'No active online orders'}\n- ⭐ **Loyalty Points**: **${custPoints}/100 pts** (Earn 5 pts per ₱50; Every 100 pts = ₱110 discount)\n- 🏆 **Top Best Seller**: **Iced Spanish Latte** & **Sea Salt Latte**\n- ☕ **Brewing Tips**: Ask about pour-over ratios, cold brew, or pastry pairings!\n- ℹ️ **Store Hours & Location**: 7:00 AM – 10:00 PM Daily at 143 Manila East Road, Taytay\n\nHow can I help you today?`;

    if (!scopeEvaluation.isAllowed || scopeEvaluation.category === 'out_of_scope') {
      dynamicFallback = `I apologize, but I cannot answer that question as I can only assist with inquiries regarding **CommonBrew Taytay** and our customer online ordering information. Please feel free to ask me anything about CommonBrew Taytay! ☕\n\nIn the meantime, let me recommend our **Top 5 Best-Selling Products** that our customers love:\n${top5Text}\n\nWould you like to check your customer status, track an active order, view your loyalty points balance, or try one of our best-sellers?`;
    } else if (scopeEvaluation.category === 'customer_status') {
      dynamicFallback = `### 👤 Customer Profile Status\n\n- **Name**: ${custName}\n- **Loyalty Balance**: **${custPoints} points** (${custPoints >= 100 ? '✅ Eligible for ₱110 discount!' : `${100 - (custPoints % 100)} more pts needed for next reward`})\n- **Registered Email**: ${activeCust?.email || 'Guest'}\n- **Contact Phone**: ${activeCust?.phone || 'Not provided'}\n- **Delivery Address**: ${activeCust?.address || 'Not set'}`;
    } else if (scopeEvaluation.category === 'order_status') {
      dynamicFallback = `### 📦 Your Order Status\n\n${activeOrdersSummary}`;
    } else if (scopeEvaluation.category === 'loyalty_status') {
      dynamicFallback = `### ⭐ Loyalty Points Status\n\n- **Current Balance**: **${custPoints}/100 points**\n- **Earning Rate**: Earn **5 points** for every **₱50 spent** on any order.\n- **Redemption Rule**: Every **100 points** = **₱110 discount** (equivalent to 1 free upsized 22oz drink!).\n- **Balance Retention**: Only 100 points are deducted when you redeem, so your extra points (e.g. 105 - 100 = 5 points) remain in your balance.\n- **How to Use**: Select the *"Use Loyalty Points ${custPoints}/100"* checkbox under Payment Method during checkout!`;
    } else if (scopeEvaluation.category === 'best_sellers') {
      dynamicFallback = `### 🏆 Top 10 Best Sellers at CommonBrew Taytay\n\n${top10Text}\n\n*Our #1 recommendation is the signature **Iced Spanish Latte** paired with a freshly baked **Belgian Choco Muffin**!*`;
    } else if (scopeEvaluation.category === 'brewing_tips') {
      dynamicFallback = `### ☕ Barista Brewing & Coffee Tips\n\n- **Pour-Over (V60)**: Use a 1:15 ratio, medium grind, and 92°C water for crisp floral and citrus notes.\n- **Cold Brew**: 1:8 coarse coffee-to-water ratio steeped 16-18 hours in the fridge for a smooth, chocolatey, low-acid cup.\n- **Espresso**: 1:2 brew ratio extracted in 25-30 seconds.\n- **Pastry Pairing**: Try our **Iced Spanish Latte** with the warm **Belgian Choco Muffin**!`;
    } else if (scopeEvaluation.category === 'general_inquiries' || scopeEvaluation.category === 'greeting') {
      dynamicFallback = `### ℹ️ Welcome to CommonBrew Taytay! ☕\n\n- **Operating Hours**: 7:00 AM – 10:00 PM Daily (Monday to Sunday)\n- **Location**: 143 Manila East Road, Brgy. San Juan, Taytay, Rizal (Near Club Manila East)\n- **Contact Phone**: +63 917 123 4567 | +63 947 496 0778\n- **Email**: commonbrewtaytay@gmail.com\n- **Payment Options**: GCash, Cash on Pickup, Cash on Delivery (COD)\n- **Delivery**: Flat ₱45 delivery fee within Taytay!`;
    }

    const reply = await generateAIChatResponse(systemPrompt, convoHistory, question, dynamicFallback);
    return res.json({ reply });
  } catch (err: any) {
    console.error('Customer chatbot error:', err);
    res.json({ reply: `Hello ${custName}! I am CommonBot. I can assist you with your Customer Status, Order Status, Loyalty Points, Best Sellers, Brewing Tips, or General Store Inquiries.` });
  }
});

// Catch-all for missing /api/* routes to prevent returning HTML index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.method} ${req.path} not found` });
});

// Global error handler to ensure JSON responses on Express errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server API error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Vite Middleware for Dev vs Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, resolve dist directory relative to process.cwd() or current file
    let distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      distPath = path.resolve(currentDir, 'dist');
    }
    if (!fs.existsSync(distPath)) {
      distPath = currentDir;
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`CommonBrew POS Server running at http://0.0.0.0:${PORT}`);

    // Asynchronously synchronize data in background without blocking server HTTP requests
    (async () => {
      try {
        syncCloudSqlDatabase().catch(err => console.error('Cloud SQL initial sync failed:', err));
        await migrateDataToSupabase().catch(err => console.error('Supabase initial migration failed:', err));
        await hydrateFromSupabase({
          users,
          customers,
          products,
          productRecipes,
          productUpsizeRecipes,
          inventory,
          transactions,
          onlineOrders,
          storeInfo
        }).catch(err => console.error('Supabase hydration failed:', err));

        // Connect to Supabase Realtime WebSocket for instantaneous updates
        setupSupabaseRealtime(
          {
            users,
            customers,
            products,
            productRecipes,
            productUpsizeRecipes,
            inventory,
            transactions,
            onlineOrders,
            storeInfo,
            categories
          },
          (event) => {
            broadcastRealtimeEvent(event);
          }
        );

        // Continuous sync runs gently every 30s as a secondary fallback
        startContinuousSupabaseSync(
          {
            users,
            customers,
            products,
            productRecipes,
            productUpsizeRecipes,
            inventory,
            transactions,
            onlineOrders,
            storeInfo,
            categories
          },
          (event) => {
            broadcastRealtimeEvent(event);
          },
          30000
        );
      } catch (err) {
        console.error('[Startup Background Init Error]', err);
      }
    })();
  });

  server.on('error', (err: any) => {
    console.error('Server failed to start:', err);
  });
}

startServer();
