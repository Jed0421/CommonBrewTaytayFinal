import { db } from './index.ts';
import {
  users,
  categories,
  inventory,
  products,
  productRecipes,
  productUpsizeRecipes,
  storeSettings,
} from './schema.ts';
import {
  commonbrewCategories,
  commonbrewInventory,
  commonbrewProducts,
  commonbrewProductRecipes,
  commonbrewProductUpsizeRecipes
} from '../data/commonbrewData.ts';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check Categories
    const existingCats = await db.select().from(categories).limit(1);
    if (existingCats.length === 0) {
      console.log('Seeding categories into Cloud SQL...');
      for (const cat of commonbrewCategories) {
        await db.insert(categories).values({
          id: cat.id,
          name: cat.name,
        }).onConflictDoNothing();
      }
    }

    // 2. Check Inventory (Raw Materials)
    const existingInv = await db.select().from(inventory).limit(1);
    if (existingInv.length === 0) {
      console.log('Seeding raw materials inventory into Cloud SQL...');
      for (const item of commonbrewInventory) {
        await db.insert(inventory).values({
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

    // 3. Check Products
    const existingProds = await db.select().from(products).limit(1);
    if (existingProds.length === 0) {
      console.log('Seeding products into Cloud SQL...');
      for (const prod of commonbrewProducts) {
        await db.insert(products).values({
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

    // 4. Check Recipes
    const existingRecipes = await db.select().from(productRecipes).limit(1);
    if (existingRecipes.length === 0) {
      console.log('Seeding product recipes into Cloud SQL...');
      for (const rec of commonbrewProductRecipes) {
        if (rec.productId && rec.inventoryItemId) {
          await db.insert(productRecipes).values({
            id: rec.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: rec.productId,
            inventoryItemId: rec.inventoryItemId,
            quantity: rec.quantity,
          }).onConflictDoNothing();
        }
      }
    }

    // 5. Check Upsize Recipes
    const existingUpRecipes = await db.select().from(productUpsizeRecipes).limit(1);
    if (existingUpRecipes.length === 0) {
      console.log('Seeding product upsize recipes into Cloud SQL...');
      for (const rec of commonbrewProductUpsizeRecipes) {
        if (rec.productId && rec.inventoryItemId) {
          await db.insert(productUpsizeRecipes).values({
            id: rec.id || `uprec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: rec.productId,
            inventoryItemId: rec.inventoryItemId,
            quantity: rec.quantity,
          }).onConflictDoNothing();
        }
      }
    }

    // 6. Check Initial Staff & Customers
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding users and customers into Cloud SQL...');
      await db.insert(users).values([
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
    const existingSettings = await db.select().from(storeSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(storeSettings).values({
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

    console.log('Cloud SQL seed complete!');
  } catch (error) {
    console.error('Error during Cloud SQL seed:', error);
  }
}
