import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq } from 'drizzle-orm';
import {
  commonbrewCategories,
  commonbrewInventory,
  commonbrewProducts,
  commonbrewProductRecipes,
  commonbrewProductUpsizeRecipes
} from '../data/commonbrewData.ts';
import bcrypt from 'bcryptjs';

export async function syncCloudSqlDatabase() {
  try {
    if (!process.env.SQL_HOST || !process.env.SQL_USER) {
      console.log('Cloud SQL environment variables not detected. Running with in-memory sync.');
      return;
    }

    // 1. Categories
    const catCount = await db.select().from(schema.categories).limit(1);
    if (catCount.length === 0) {
      console.log('[Cloud SQL] Migrating categories...');
      for (const cat of commonbrewCategories) {
        await db.insert(schema.categories).values({
          id: cat.id,
          name: cat.name,
        }).onConflictDoNothing();
      }
    }

    // 2. Raw Materials Inventory
    const invCount = await db.select().from(schema.inventory).limit(1);
    if (invCount.length === 0) {
      console.log('[Cloud SQL] Migrating raw materials inventory...');
      for (const item of commonbrewInventory) {
        await db.insert(schema.inventory).values({
          id: item.id,
          name: item.name,
          unit: item.unit,
          currentStock: item.currentStock,
          criticalLevel: item.criticalLevel,
          category: item.category || 'General',
          unitCost: item.unitCost || 0,
          supplierName: item.supplierName || 'Local Supplier',
          isArchived: false,
        }).onConflictDoNothing();
      }
    }

    // 3. Products
    const prodCount = await db.select().from(schema.products).limit(1);
    if (prodCount.length === 0) {
      console.log('[Cloud SQL] Migrating products...');
      for (const prod of commonbrewProducts) {
        await db.insert(schema.products).values({
          id: prod.id,
          name: prod.name,
          categoryId: prod.categoryId,
          price: prod.price,
          imageUrl: prod.imageUrl || null,
          isAvailable: prod.isAvailable,
          productType: prod.productType,
          upsizePrice: prod.upsizePrice ?? null,
          description: prod.description || null,
          isArchived: prod.isArchived ?? false,
        }).onConflictDoNothing();
      }
    }

    // 4. Base Recipes
    const recCount = await db.select().from(schema.productRecipes).limit(1);
    if (recCount.length === 0) {
      console.log('[Cloud SQL] Migrating recipe formulas...');
      for (const rec of commonbrewProductRecipes) {
        if (rec.productId && rec.inventoryItemId) {
          await db.insert(schema.productRecipes).values({
            id: rec.id || `rec-${Math.random().toString(36).substring(2, 9)}`,
            productId: rec.productId,
            inventoryItemId: rec.inventoryItemId,
            quantity: rec.quantity,
          }).onConflictDoNothing();
        }
      }
    }

    // 5. Upsize Recipes
    const uprecCount = await db.select().from(schema.productUpsizeRecipes).limit(1);
    if (uprecCount.length === 0) {
      console.log('[Cloud SQL] Migrating upsize recipe formulas...');
      for (const rec of commonbrewProductUpsizeRecipes) {
        if (rec.productId && rec.inventoryItemId) {
          await db.insert(schema.productUpsizeRecipes).values({
            id: rec.id || `uprec-${Math.random().toString(36).substring(2, 9)}`,
            productId: rec.productId,
            inventoryItemId: rec.inventoryItemId,
            quantity: rec.quantity,
          }).onConflictDoNothing();
        }
      }
    }

    // 6. Users & Customers
    const userCount = await db.select().from(schema.users).limit(1);
    if (userCount.length === 0) {
      console.log('[Cloud SQL] Migrating staff and customer accounts...');
      await db.insert(schema.users).values([
        {
          id: 'u-1',
          fullName: 'Manager Admin',
          username: 'admin',
          email: 'admin@commonbrew.ph',
          phone: '09171234567',
          passwordHash: bcrypt.hashSync('admin123', 10),
          role: 'Administrator',
          isActive: true,
          loyaltyPoints: 0,
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
          loyaltyPoints: 0,
        },
        {
          id: 'cust-jedi-01',
          fullName: 'Jedidiah Galicia',
          username: 'Jedi',
          email: 'jedidiah0421@gmail.com',
          phone: '+639474960778',
          passwordHash: bcrypt.hashSync('JDG_0421', 10),
          role: 'Customer',
          address: '#36 Dalandanan Street , Phase 3 BRGY. San Roque',
          loyaltyPoints: 105,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
        },
        {
          id: 'cust-maria-02',
          fullName: 'Maria Santos',
          username: 'maria_s',
          email: 'maria.santos@gmail.com',
          phone: '+639181234567',
          passwordHash: bcrypt.hashSync('maria123', 10),
          role: 'Customer',
          address: 'Block 4 Lot 9, Highway Hills, Taytay, Rizal',
          loyaltyPoints: 75,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
        }
      ]).onConflictDoNothing();
    }

    // 7. Store Settings
    const storeCount = await db.select().from(schema.storeSettings).limit(1);
    if (storeCount.length === 0) {
      console.log('[Cloud SQL] Migrating store info...');
      await db.insert(schema.storeSettings).values({
        id: 'store-1',
        name: 'CommonBrew Taytay',
        tagline: 'Crafted Coffee & Everyday Comforts in Taytay, Rizal',
        aboutText: 'Welcome to CommonBrew Taytay! Born out of passion for artisanal specialty coffee, fresh locally sourced dairy, and comforting warm drink series.',
        address: 'Unit 7 Leoncio Commercial Building National Road, Sitio Ilog Pugad, San Juan, Taytay, 1920 Rizal',
        hours: 'Monday to Sunday: 11:00 AM - 9:00 PM',
        phone: '09176781989',
        email: 'hello@commonbrewtaytay.com',
      }).onConflictDoNothing();
    }

    // 8. Ensure Straw & Cups Packaging Items and Recipes exist in Cloud SQL
    await db.insert(schema.inventory).values([
      {
        id: 'inv-55',
        name: 'Drinking Straw',
        unit: 'pcs',
        currentStock: 3000,
        criticalLevel: 500,
        category: 'Packaging & Cups',
        unitCost: 0.50,
        supplierName: 'EcoPack Plastics Taytay',
        isArchived: false,
      },
      {
        id: 'inv-56',
        name: '16oz Hot Paper Cup & Lid (Upsize)',
        unit: 'pcs',
        currentStock: 2000,
        criticalLevel: 400,
        category: 'Packaging & Cups',
        unitCost: 4.50,
        supplierName: 'EcoPack Plastics Taytay',
        isArchived: false,
      }
    ]).onConflictDoNothing();

    console.log('[Cloud SQL] Database sync and data migration completed successfully!');
  } catch (err) {
    console.error('[Cloud SQL] Migration sync error:', err);
  }
}

// Background sync helpers
export async function syncTransactionToCloudSql(tx: any) {
  try {
    if (!process.env.SQL_HOST) return;
    await db.insert(schema.transactions).values({
      id: tx.id,
      transactionRef: tx.transactionRef,
      cashierId: tx.cashierId || null,
      cashierName: tx.cashierName || null,
      paymentMethod: tx.paymentMethod || 'Cash',
      subtotal: tx.subtotal || 0,
      totalAmount: tx.totalAmount || 0,
      cashTendered: tx.cashTendered || null,
      changeAmount: tx.changeAmount || null,
      status: tx.status || 'completed',
      items: tx.items || [],
      createdAt: new Date(tx.createdAt || Date.now())
    }).onConflictDoNothing();
  } catch (e) {
    console.error('[Cloud SQL] Error syncing transaction:', e);
  }
}

export async function syncOnlineOrderToCloudSql(order: any) {
  try {
    if (!process.env.SQL_HOST) return;
    await db.insert(schema.onlineOrders).values({
      id: order.id,
      orderRef: order.orderRef,
      customerId: order.customerId || null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || null,
      deliveryEmailSent: order.deliveryEmailSent || false,
      deliveryEmailRecipient: order.deliveryEmailRecipient || null,
      deliveryEmailSentAt: order.deliveryEmailSentAt ? new Date(order.deliveryEmailSentAt) : null,
      inventoryDeducted: order.inventoryDeducted || false,
      orderType: order.orderType || 'Pickup',
      deliveryAddress: order.deliveryAddress || null,
      tableNumber: order.tableNumber || null,
      paymentMethod: order.paymentMethod,
      gcashAccount: order.gcashAccount || null,
      gcashReferenceNumber: order.gcashReferenceNumber || null,
      gcashReceiptImage: order.gcashReceiptImage || null,
      items: order.items || [],
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee || 0,
      loyaltyDiscount: order.loyaltyDiscount || 0,
      loyaltyPointsRedeemed: order.loyaltyPointsRedeemed || 0,
      totalAmount: order.totalAmount,
      status: order.status || 'Pending',
      notes: order.notes || null,
      createdAt: new Date(order.createdAt || Date.now()),
      updatedAt: new Date(order.updatedAt || Date.now())
    }).onConflictDoNothing();
  } catch (e) {
    console.error('[Cloud SQL] Error syncing online order:', e);
  }
}

export async function syncInventoryUpdateToCloudSql(itemId: string, newStock: number) {
  try {
    if (!process.env.SQL_HOST) return;
    await db.update(schema.inventory)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(eq(schema.inventory.id, itemId));
  } catch (e) {
    console.error('[Cloud SQL] Error syncing inventory stock:', e);
  }
}
