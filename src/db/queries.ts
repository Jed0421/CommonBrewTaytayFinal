import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Categories
export async function getDBCategories() {
  return await db.select().from(schema.categories);
}

// Inventory
export async function getDBInventory() {
  return await db.select().from(schema.inventory);
}

export async function updateDBInventoryStock(itemId: string, newStock: number) {
  return await db.update(schema.inventory)
    .set({ currentStock: newStock, updatedAt: new Date() })
    .where(eq(schema.inventory.id, itemId));
}

// Products
export async function getDBProducts() {
  return await db.select().from(schema.products);
}

export async function getDBProductRecipes() {
  return await db.select().from(schema.productRecipes);
}

export async function getDBProductUpsizeRecipes() {
  return await db.select().from(schema.productUpsizeRecipes);
}

// Transactions
export async function getDBTransactions() {
  return await db.select().from(schema.transactions).orderBy(desc(schema.transactions.createdAt));
}

export async function insertDBTransaction(tx: typeof schema.transactions.$inferInsert) {
  return await db.insert(schema.transactions).values(tx);
}

// Online Orders
export async function getDBOnlineOrders() {
  return await db.select().from(schema.onlineOrders).orderBy(desc(schema.onlineOrders.createdAt));
}

export async function insertDBOnlineOrder(order: typeof schema.onlineOrders.$inferInsert) {
  return await db.insert(schema.onlineOrders).values(order);
}

export async function updateDBOnlineOrderStatus(orderId: string, status: string, inventoryDeducted?: boolean) {
  return await db.update(schema.onlineOrders)
    .set({
      status,
      updatedAt: new Date(),
      ...(inventoryDeducted !== undefined ? { inventoryDeducted } : {})
    })
    .where(eq(schema.onlineOrders.id, orderId));
}

// Users & Customers
export async function getDBUsers() {
  return await db.select().from(schema.users);
}

export async function getDBStoreSettings() {
  const list = await db.select().from(schema.storeSettings).limit(1);
  return list[0];
}
