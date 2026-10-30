import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import {
  commonbrewCategories,
  commonbrewInventory,
  commonbrewProducts,
  commonbrewProductRecipes,
  commonbrewProductUpsizeRecipes
} from '../data/commonbrewData.ts';
import bcrypt from 'bcryptjs';

/**
 * Hydrates the server's in-memory state with existing records from Supabase
 * so everything is kept in sync with the database across restarts and reloads.
 */
export async function hydrateFromSupabase(state: {
  users: any[];
  customers: any[];
  products: any[];
  productRecipes: any[];
  productUpsizeRecipes: any[];
  inventory: any[];
  transactions: any[];
  onlineOrders: any[];
  storeInfo: any;
}) {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[Supabase Hydration] Skipped: Supabase not configured.');
    return;
  }

  try {
    console.log('[Supabase Hydration] Loading live data from Supabase...');

    // 1. Users (Staff and Customers)
    const { data: dbUsers, error: userErr } = await supabase.from('users').select('*');
    if (userErr) {
      console.error('[Supabase Hydration] Error loading users:', userErr);
    } else if (dbUsers && dbUsers.length > 0) {
      console.log(`[Supabase Hydration] Loaded ${dbUsers.length} users from Supabase.`);
      for (const u of dbUsers) {
        if (u.role === 'Customer') {
          const existing = state.customers.find(c => c.id === u.id || (c.email && u.email && c.email.toLowerCase() === u.email.toLowerCase()));
          if (existing) {
            existing.fullName = u.full_name || existing.fullName;
            existing.username = u.username || existing.username;
            existing.email = u.email || existing.email;
            existing.phone = u.phone || existing.phone;
            existing.passwordHash = u.password_hash || existing.passwordHash;
            existing.address = u.address || existing.address;
            existing.loyaltyPoints = u.loyalty_points !== undefined && u.loyalty_points !== null ? u.loyalty_points : existing.loyaltyPoints;
            existing.isEmailVerified = u.is_email_verified !== undefined && u.is_email_verified !== null ? u.is_email_verified : existing.isEmailVerified;
            existing.isPhoneVerified = u.is_phone_verified !== undefined && u.is_phone_verified !== null ? u.is_phone_verified : existing.isPhoneVerified;
          } else {
            state.customers.push({
              id: u.id,
              fullName: u.full_name || u.username,
              username: u.username,
              email: u.email || '',
              phone: u.phone || '',
              passwordHash: u.password_hash || '',
              address: u.address || '',
              loyaltyPoints: u.loyalty_points || 0,
              isEmailVerified: u.is_email_verified || false,
              isPhoneVerified: u.is_phone_verified || false,
              createdAt: u.created_at || new Date().toISOString()
            });
          }
        } else {
          // Staff user ('Administrator' or 'Cashier')
          const existing = state.users.find(staff => staff.id === u.id || staff.username.toLowerCase() === u.username.toLowerCase());
          if (existing) {
            existing.fullName = u.full_name || existing.fullName;
            existing.username = u.username || existing.username;
            existing.email = u.email || existing.email;
            existing.phone = u.phone || existing.phone;
            existing.passwordHash = u.password_hash || existing.passwordHash;
            existing.role = u.role || existing.role;
            existing.isActive = u.is_active !== undefined && u.is_active !== null ? u.is_active : existing.isActive;
          } else {
            state.users.push({
              id: u.id,
              fullName: u.full_name || u.username,
              username: u.username,
              email: u.email || undefined,
              phone: u.phone || undefined,
              passwordHash: u.password_hash || '',
              role: u.role || 'Cashier',
              isActive: u.is_active !== undefined ? u.is_active : true,
              createdAt: u.created_at || new Date().toISOString()
            });
          }
        }
      }
    }

    // 2. Products
    const { data: dbProducts, error: prodErr } = await supabase.from('products').select('*');
    if (prodErr) {
      console.error('[Supabase Hydration] Error loading products:', prodErr);
    } else if (dbProducts && dbProducts.length > 0) {
      console.log(`[Supabase Hydration] Loaded ${dbProducts.length} products from Supabase.`);
      const legacyImageFixes: { id: string; url: string }[] = [];
      for (const p of dbProducts) {
        const existing = state.products.find(prod => prod.id === p.id);
        if (existing) {
          existing.name = p.name;
          existing.categoryId = p.category_id;
          existing.price = Number(p.price);
          existing.upsizePrice = p.upsize_price !== null && p.upsize_price !== undefined ? Number(p.upsize_price) : null;
          // If Supabase still holds an OLD built-in image path (/src/assets/...) and the code has a
          // newer one, keep the new one and write it back to Supabase. Custom uploads are never touched.
          const dbImg: string | null = p.image_url || null;
          if (dbImg && dbImg.startsWith('/src/assets/') && existing.imageUrl && existing.imageUrl !== dbImg) {
            legacyImageFixes.push({ id: p.id, url: existing.imageUrl });
          } else {
            existing.imageUrl = dbImg || existing.imageUrl;
          }
          existing.isAvailable = p.is_available !== undefined ? p.is_available : existing.isAvailable;
          existing.productType = p.product_type || existing.productType;
          existing.isArchived = p.is_archived !== undefined ? p.is_archived : existing.isArchived;
        } else {
          state.products.push({
            id: p.id,
            name: p.name,
            categoryId: p.category_id,
            price: Number(p.price),
            upsizePrice: p.upsize_price ? Number(p.upsize_price) : null,
            imageUrl: p.image_url,
            isAvailable: p.is_available !== undefined ? p.is_available : true,
            productType: p.product_type || 'Drink',
            isArchived: p.is_archived || false,
            createdAt: p.created_at
          });
        }
      }

      if (legacyImageFixes.length > 0) {
        for (const fix of legacyImageFixes) {
          const { error: imgErr } = await supabase.from('products').update({ image_url: fix.url }).eq('id', fix.id);
          if (imgErr) console.error(`[Supabase Hydration] Could not update image for ${fix.id}:`, imgErr);
        }
        console.log(`[Supabase Hydration] Updated ${legacyImageFixes.length} product image path(s) in Supabase to the new images.`);
      }
    }

    // 3. Inventory
    const { data: dbInv, error: invErr } = await supabase.from('inventory').select('*');
    if (invErr) {
      console.error('[Supabase Hydration] Error loading inventory:', invErr);
    } else if (dbInv && dbInv.length > 0) {
      console.log(`[Supabase Hydration] Loaded ${dbInv.length} inventory items from Supabase.`);
      for (const inv of dbInv) {
        const existing = state.inventory.find(i => i.id === inv.id);
        if (existing) {
          existing.name = inv.name;
          existing.unit = inv.unit;
          existing.currentStock = Number(inv.current_stock);
          existing.criticalLevel = Number(inv.critical_level);
          existing.category = inv.category || existing.category;
          existing.unitCost = inv.unit_cost !== null ? Number(inv.unit_cost) : existing.unitCost;
          existing.supplierName = inv.supplier_name || existing.supplierName;
          existing.isArchived = inv.is_archived !== undefined ? inv.is_archived : existing.isArchived;
        } else {
          state.inventory.push({
            id: inv.id,
            name: inv.name,
            unit: inv.unit,
            currentStock: Number(inv.current_stock),
            criticalLevel: Number(inv.critical_level),
            category: inv.category,
            unitCost: Number(inv.unit_cost) || 0,
            supplierName: inv.supplier_name,
            isArchived: inv.is_archived || false,
            updatedAt: inv.updated_at || inv.created_at
          });
        }
      }
    }

    // 4. Transactions
    const { data: dbTx, error: txErr } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(200);
    if (txErr) {
      console.error('[Supabase Hydration] Error loading transactions:', txErr);
    } else if (dbTx && dbTx.length > 0) {
      console.log(`[Supabase Hydration] Loaded ${dbTx.length} transactions from Supabase.`);
      for (const row of dbTx) {
        const existing = state.transactions.find(t => t.id === row.id || t.transactionRef === row.ref_code);
        if (!existing) {
          state.transactions.push({
            id: row.id,
            transactionRef: row.ref_code,
            cashierId: 'u-1',
            cashierName: row.cashier_name || 'Cashier',
            paymentMethod: row.payment_method || 'Cash',
            subtotal: Number(row.subtotal) || 0,
            totalAmount: Number(row.total) || 0,
            cashTendered: row.amount_tendered !== null ? Number(row.amount_tendered) : null,
            changeAmount: row.change_amount !== null ? Number(row.change_amount) : null,
            status: row.is_voided ? 'Voided' : 'completed',
            voidReason: row.void_reason || undefined,
            createdAt: row.created_at,
            items: Array.isArray(row.items) ? row.items : []
          });
        }
      }
    }

    // 5. Online Orders
    const { data: dbOrders, error: ordErr } = await supabase.from('online_orders').select('*').order('created_at', { ascending: false }).limit(200);
    if (ordErr) {
      console.error('[Supabase Hydration] Error loading online orders:', ordErr);
    } else if (dbOrders && dbOrders.length > 0) {
      console.log(`[Supabase Hydration] Loaded ${dbOrders.length} online orders from Supabase.`);
      for (const row of dbOrders) {
        const existing = state.onlineOrders.find(o => o.id === row.id || o.orderRef === row.order_ref);
        if (!existing) {
          state.onlineOrders.push({
            id: row.id,
            orderRef: row.order_ref,
            customerId: row.customer_id || undefined,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            deliveryAddress: row.customer_address || undefined,
            paymentMethod: row.payment_method || 'GCash',
            orderType: row.delivery_type || 'Pickup',
            items: Array.isArray(row.items) ? row.items : [],
            subtotal: Number(row.subtotal) || 0,
            deliveryFee: Number(row.delivery_fee) || 0,
            loyaltyDiscount: Number(row.loyalty_discount) || 0,
            loyaltyPointsRedeemed: Number(row.loyalty_points_redeemed) || 0,
            totalAmount: Number(row.total_amount) || 0,
            inventoryDeducted: Boolean(row.inventory_deducted),
            status: row.status || 'Pending',
            notes: row.notes || undefined,
            cancelReason: row.cancel_reason || undefined,
            cancelledAt: row.cancelled_at || undefined,
            createdAt: row.created_at
          });
        }
      }
    }

    // 6. Store Settings
    const { data: dbStore, error: storeErr } = await supabase.from('store_settings').select('*').limit(1);
    if (!storeErr && dbStore && dbStore[0]) {
      const s = dbStore[0];
      if (s.store_name) state.storeInfo.name = s.store_name;
      if (s.address) state.storeInfo.address = s.address;
      if (s.phone) state.storeInfo.phone = s.phone;
      if (s.email) state.storeInfo.email = s.email;
      if (s.opening_time && s.closing_time) {
        state.storeInfo.hours = `Monday to Sunday: ${s.opening_time} - ${s.closing_time}`;
      }
      if (s.announcement) state.storeInfo.aboutText = s.announcement;
      if (s.gcash_qr_url) state.storeInfo.gcashQrUrl = s.gcash_qr_url;
      if (s.maya_qr_url) state.storeInfo.mayaQrUrl = s.maya_qr_url;
    }

    console.log('[Supabase Hydration] State hydration completed successfully.');
  } catch (err) {
    console.error('[Supabase Hydration] Failed to hydrate data from Supabase:', err);
  }
}

/**
 * Ensures initial tables have baseline data in Supabase.
 */
export async function migrateDataToSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[Supabase Migration] Skipped: SUPABASE_URL or SUPABASE_SERVICE_KEY not provided.');
    return { success: false, message: 'Supabase credentials not configured' };
  }

  try {
    console.log('[Supabase Migration] Checking baseline data in Supabase...');

    // 1. Categories
    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (!catCount || catCount === 0) {
      console.log('[Supabase Migration] Inserting categories...');
      const catRows = commonbrewCategories.map(c => ({
        id: c.id,
        name: c.name,
        is_archived: false,
      }));
      const { error: catErr } = await supabase.from('categories').upsert(catRows);
      if (catErr) console.error('[Supabase Migration] Categories error:', catErr);
    }

    // 2. Inventory Items
    const { count: invCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
    if (!invCount || invCount === 0) {
      console.log('[Supabase Migration] Inserting inventory items...');
      const invRows = commonbrewInventory.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        current_stock: i.currentStock,
        critical_level: i.criticalLevel,
        category: i.category,
        unit_cost: i.unitCost || 0,
        supplier_name: i.supplierName || 'General',
        is_archived: false,
      }));
      const { error: invErr } = await supabase.from('inventory').upsert(invRows);
      if (invErr) console.error('[Supabase Migration] Inventory error:', invErr);
    }

    // 3. Products
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (!prodCount || prodCount === 0) {
      console.log('[Supabase Migration] Inserting products...');
      const prodRows = commonbrewProducts.map(p => ({
        id: p.id,
        name: p.name,
        category_id: p.categoryId,
        price: p.price,
        upsize_price: p.upsizePrice || null,
        image_url: p.imageUrl,
        is_available: p.isAvailable,
        product_type: p.productType || 'Drink',
        is_archived: false,
      }));
      const { error: prodErr } = await supabase.from('products').upsert(prodRows);
      if (prodErr) console.error('[Supabase Migration] Products error:', prodErr);
    }

    // 4. Product Recipes
    const { count: recCount } = await supabase.from('product_recipes').select('*', { count: 'exact', head: true });
    if (!recCount || recCount === 0) {
      console.log('[Supabase Migration] Inserting product recipes...');
      const recRows = commonbrewProductRecipes.map(r => ({
        id: r.id,
        product_id: r.productId,
        inventory_item_id: r.inventoryItemId,
        quantity: r.quantity,
      }));
      const { error: recErr } = await supabase.from('product_recipes').upsert(recRows);
      if (recErr) console.error('[Supabase Migration] Product recipes error:', recErr);
    }

    // 5. Upsize Recipes
    const { count: uprecCount } = await supabase.from('product_upsize_recipes').select('*', { count: 'exact', head: true });
    if (!uprecCount || uprecCount === 0) {
      console.log('[Supabase Migration] Inserting upsize recipes...');
      const uprecRows = commonbrewProductUpsizeRecipes.map(r => ({
        id: r.id,
        product_id: r.productId,
        inventory_item_id: r.inventoryItemId,
        quantity: r.quantity,
      }));
      const { error: uprecErr } = await supabase.from('product_upsize_recipes').upsert(uprecRows);
      if (uprecErr) console.error('[Supabase Migration] Upsize recipes error:', uprecErr);
    }

    // 6. Users / Accounts (both staff and customers)
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (!userCount || userCount === 0) {
      console.log('[Supabase Migration] Inserting staff & customer users...');
      const userRows = [
        {
          id: 'u-1',
          full_name: 'Manager Admin',
          username: 'admin',
          email: 'admin@commonbrew.ph',
          phone: '09171234567',
          password_hash: bcrypt.hashSync('admin123', 10),
          role: 'Administrator',
          is_active: true,
          loyalty_points: 0,
        },
        {
          id: 'u-2',
          full_name: 'Maria Cashier',
          username: 'cashier',
          email: 'cashier@commonbrew.ph',
          phone: '09181234567',
          password_hash: bcrypt.hashSync('cashier123', 10),
          role: 'Cashier',
          is_active: true,
          loyalty_points: 0,
        },
        {
          id: 'cust-jedi-01',
          full_name: 'Jedidiah Galicia',
          username: 'Jedi',
          email: 'jedidiah0421@gmail.com',
          phone: '+639474960778',
          password_hash: bcrypt.hashSync('JDG_0421', 10),
          role: 'Customer',
          address: '#36 Dalandanan Street , Phase 3 BRGY. San Roque',
          loyalty_points: 105,
          is_email_verified: true,
          is_phone_verified: true,
          is_active: true,
        },
        {
          id: 'cust-maria-02',
          full_name: 'Maria Santos',
          username: 'maria_s',
          email: 'maria.santos@gmail.com',
          phone: '+639181234567',
          password_hash: bcrypt.hashSync('maria123', 10),
          role: 'Customer',
          address: 'Block 4 Lot 9, Highway Hills, Taytay, Rizal',
          loyalty_points: 75,
          is_email_verified: true,
          is_phone_verified: true,
          is_active: true,
        }
      ];
      const { error: userErr } = await supabase.from('users').upsert(userRows);
      if (userErr) console.error('[Supabase Migration] Users error:', userErr);
    }

    // 7. Store Settings
    const { count: storeCount } = await supabase.from('store_settings').select('*', { count: 'exact', head: true });
    if (!storeCount || storeCount === 0) {
      console.log('[Supabase Migration] Inserting store settings...');
      await supabase.from('store_settings').upsert({
        id: 'settings-1',
        store_name: 'CommonBrew Taytay',
        address: 'Manila East Road, Brgy. San Juan, Taytay, Rizal',
        phone: '0917-123-4567',
        email: 'hello@commonbrew.ph',
        opening_time: '11:00 AM',
        closing_time: '9:00 PM',
        is_store_open: true,
        announcement: 'Freshly brewed artisan drinks and warm snacks prepared daily in Taytay, Rizal!'
      });
    }

    console.log('[Supabase Migration] Initial data verified and ready.');
    return { success: true };
  } catch (err) {
    console.error('[Supabase Migration] Unexpected error:', err);
    return { success: false, error: err };
  }
}

/**
 * Synchronizes a User (Staff or Customer) to Supabase 'users' table.
 * Used when creating new accounts, updating staff info, or updating customer profiles.
 */
export async function syncUserToSupabase(user: any, isCustomer = false) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const payload = {
      id: user.id,
      full_name: user.fullName || user.username,
      username: user.username,
      email: user.email || null,
      phone: user.phone || null,
      role: isCustomer ? 'Customer' : (user.role || 'Cashier'),
      password_hash: user.passwordHash,
      is_active: user.isActive !== undefined ? user.isActive : true,
      address: user.address || null,
      loyalty_points: user.loyaltyPoints !== undefined ? user.loyaltyPoints : 0,
      is_phone_verified: user.isPhoneVerified !== undefined ? user.isPhoneVerified : null,
      is_email_verified: user.isEmailVerified !== undefined ? user.isEmailVerified : null,
      created_at: user.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.error('[Supabase User Sync] Error upserting user:', error);
    } else {
      console.log(`[Supabase User Sync] Synced ${isCustomer ? 'Customer' : 'Staff'} ${user.username} (${user.id}) to Supabase.`);
    }
  } catch (err) {
    console.error('[Supabase User Sync] Exception:', err);
  }
}

/**
 * Convenience helper for Customer sync
 */
export async function syncCustomerToSupabase(cust: any) {
  return syncUserToSupabase(cust, true);
}

/**
 * Synchronizes password change to Supabase (by user ID or email).
 */
export async function syncPasswordToSupabase(userIdOrEmail: string, passwordHash: string) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const isEmail = userIdOrEmail.includes('@');
    let q = supabase.from('users').update({ password_hash: passwordHash });
    if (isEmail) {
      q = q.ilike('email', userIdOrEmail.trim().toLowerCase());
    } else {
      q = q.eq('id', userIdOrEmail.trim());
    }
    const { error } = await q;
    if (error) {
      console.error('[Supabase Password Sync] Error updating password:', error);
    } else {
      console.log(`[Supabase Password Sync] Password updated for ${userIdOrEmail} in Supabase.`);
    }
  } catch (err) {
    console.error('[Supabase Password Sync] Exception:', err);
  }
}

/**
 * Synchronizes Product changes (create/edit) to Supabase 'products' table.
 */
export async function syncProductToSupabase(prod: any, recipes?: any[], upsizeRecipes?: any[]) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    if (prod.categoryId) {
      const { data: catRow } = await supabase.from('categories').select('id').eq('id', prod.categoryId).limit(1);
      if (!catRow || catRow.length === 0) {
        await supabase.from('categories').upsert({
          id: prod.categoryId,
          name: prod.categoryName || prod.categoryId.replace(/^cat-/, '').toUpperCase(),
          is_archived: false
        });
      }
    }

    const payload = {
      id: prod.id,
      name: prod.name,
      category_id: prod.categoryId || null,
      price: Number(prod.price),
      upsize_price: prod.upsizePrice !== undefined && prod.upsizePrice !== null ? Number(prod.upsizePrice) : null,
      image_url: prod.imageUrl || null,
      is_available: prod.isAvailable !== undefined ? prod.isAvailable : true,
      product_type: prod.productType || 'Drink',
      is_archived: prod.isArchived || false,
      created_at: prod.createdAt || new Date().toISOString()
    };
    const { error: prodErr } = await supabase.from('products').upsert(payload);
    if (prodErr) {
      console.error('[Supabase Product Sync] Error upserting product:', prodErr);
    } else {
      console.log(`[Supabase Product Sync] Product ${prod.name} (${prod.id}) synced to Supabase.`);
    }

    // Sync recipes if provided
    if (Array.isArray(recipes)) {
      await supabase.from('product_recipes').delete().eq('product_id', prod.id);
      const validRecipes = recipes
        .filter(r => r.inventoryItemId && r.quantity > 0)
        .map(r => ({
          id: `rec-${prod.id}-${r.inventoryItemId}`,
          product_id: prod.id,
          inventory_item_id: r.inventoryItemId,
          quantity: Number(r.quantity)
        }));
      if (validRecipes.length > 0) {
        await supabase.from('product_recipes').upsert(validRecipes);
      }
    }

    if (Array.isArray(upsizeRecipes)) {
      await supabase.from('product_upsize_recipes').delete().eq('product_id', prod.id);
      const validUpsize = upsizeRecipes
        .filter(r => r.inventoryItemId && r.quantity > 0)
        .map(r => ({
          id: `uprec-${prod.id}-${r.inventoryItemId}`,
          product_id: prod.id,
          inventory_item_id: r.inventoryItemId,
          quantity: Number(r.quantity)
        }));
      if (validUpsize.length > 0) {
        await supabase.from('product_upsize_recipes').upsert(validUpsize);
      }
    }
  } catch (err) {
    console.error('[Supabase Product Sync] Exception:', err);
  }
}

/**
 * Synchronizes Product availability (mark available/unavailable/out-of-stock).
 */
export async function syncProductAvailabilityToSupabase(productId: string, isAvailable: boolean) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { error } = await supabase.from('products')
      .update({ is_available: isAvailable })
      .eq('id', productId);
    if (error) console.error('[Supabase Product Availability] Error:', error);
    else console.log(`[Supabase Product Availability] Set ${productId} is_available=${isAvailable}`);
  } catch (err) {
    console.error('[Supabase Product Availability] Exception:', err);
  }
}

/**
 * Synchronizes POS Transaction to Supabase 'transactions' table with exact columns:
 * id, ref_code, items, subtotal, discount, discount_type, total, amount_tendered, change_amount, payment_method, cashier_name, is_voided, void_reason, created_at
 */
export async function syncTransactionToSupabase(tx: any) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const isVoided = tx.status === 'Voided' || tx.status === 'void';
    const payload = {
      id: tx.id,
      ref_code: tx.transactionRef || tx.ref_code || `CB-TX-${Date.now()}`,
      items: Array.isArray(tx.items) ? tx.items : [],
      subtotal: Number(tx.subtotal) || 0,
      discount: 0,
      discount_type: 'none',
      total: tx.totalAmount !== undefined ? Number(tx.totalAmount) : (Number(tx.total) || 0),
      amount_tendered: tx.cashTendered !== undefined && tx.cashTendered !== null ? Number(tx.cashTendered) : (tx.totalAmount || 0),
      change_amount: tx.changeAmount !== undefined && tx.changeAmount !== null ? Number(tx.changeAmount) : 0,
      payment_method: tx.paymentMethod || 'Cash',
      cashier_name: tx.cashierName || 'Cashier',
      is_voided: isVoided,
      void_reason: tx.voidReason || null,
      created_at: tx.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) {
      console.error('[Supabase Transaction Sync] Error:', error);
    } else {
      console.log(`[Supabase Transaction Sync] Transaction ${payload.ref_code} (${tx.id}) saved to Supabase.`);
    }
  } catch (err) {
    console.error('[Supabase Transaction Sync] Exception:', err);
  }
}

/**
 * Marks transaction as voided in Supabase.
 */
export async function syncVoidTransactionToSupabase(txId: string, voidReason?: string, refCode?: string) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    let q = supabase.from('transactions').update({
      is_voided: true,
      void_reason: voidReason || 'Voided by Manager'
    });
    if (refCode) {
      q = q.or(`id.eq.${txId},ref_code.eq.${refCode}`);
    } else {
      q = q.or(`id.eq.${txId},ref_code.eq.${txId}`);
    }
    const { error } = await q;
    if (error) {
      console.error('[Supabase Void Transaction] Error:', error);
    } else {
      console.log(`[Supabase Void Transaction] Transaction ${txId} / ${refCode || ''} marked voided in Supabase.`);
    }
  } catch (err) {
    console.error('[Supabase Void Transaction] Exception:', err);
  }
}

/**
 * Synchronizes Online Order to Supabase 'online_orders' table with exact columns:
 * id, order_ref, customer_id, customer_name, customer_phone, customer_address, payment_method, delivery_type, items, subtotal, delivery_fee, loyalty_discount, loyalty_points_redeemed, total_amount, inventory_deducted, status, notes, created_at
 */
export async function syncOnlineOrderToSupabase(order: any) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const payload = {
      id: order.id,
      order_ref: order.orderRef,
      customer_id: order.customerId || null,
      customer_name: order.customerName || 'Guest Customer',
      customer_phone: order.customerPhone || 'N/A',
      customer_address: order.deliveryAddress || 'Storefront / Taytay',
      payment_method: order.paymentMethod || 'GCash',
      delivery_type: order.orderType || 'Pickup',
      items: Array.isArray(order.items) ? order.items : [],
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.deliveryFee) || 0,
      loyalty_discount: Number(order.loyaltyDiscount) || 0,
      loyalty_points_redeemed: Number(order.loyaltyPointsRedeemed) || 0,
      total_amount: Number(order.totalAmount) || 0,
      inventory_deducted: Boolean(order.inventoryDeducted),
      status: order.status || 'Pending',
      notes: order.notes || null,
      cancel_reason: order.status === 'Cancelled' ? (order.cancelReason || null) : null,
      cancelled_at: order.status === 'Cancelled' ? (order.cancelledAt || order.updatedAt || new Date().toISOString()) : null,
      created_at: order.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('online_orders').upsert(payload);
    if (error) {
      console.error('[Supabase Online Order Sync] Error:', error);
    } else {
      console.log(`[Supabase Online Order Sync] Order ${order.orderRef} (${order.status}) synced to Supabase.`);
    }
  } catch (err) {
    console.error('[Supabase Online Order Sync] Exception:', err);
  }
}

/**
 * Synchronizes inventory current stock updates.
 */
export async function syncInventoryUpdateToSupabase(itemId: string, newStock: number) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { error } = await supabase.from('inventory')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', itemId);
    if (error) console.error('[Supabase Inventory Sync] Error:', error);
  } catch (err) {
    console.error('[Supabase Inventory Sync] Exception:', err);
  }
}

/**
 * Logs inventory changes to Supabase 'inventory_logs' table.
 */
export async function syncInventoryLogToSupabase(log: any) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const payload = {
      id: log.id || `log-${Date.now()}`,
      inventory_item_id: log.inventoryItemId,
      change_type: log.changeType || 'stock_in',
      quantity_change: Number(log.quantityChange) || 0,
      note: log.note || '',
      performed_by: log.performedBy || 'Manager',
      created_at: log.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('inventory_logs').insert(payload);
    if (error) console.error('[Supabase Inventory Log Sync] Error:', error);
  } catch (err) {
    console.error('[Supabase Inventory Log Sync] Exception:', err);
  }
}

/**
 * Synchronizes store settings to Supabase 'store_settings' table.
 */
export async function syncStoreSettingsToSupabase(store: any) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const payload = {
      id: 'settings-1',
      store_name: store.name || 'CommonBrew Taytay',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      opening_time: '10:00 AM',
      closing_time: '10:00 PM',
      is_store_open: true,
      announcement: store.aboutText || store.announcement || '',
      gcash_qr_url: store.gcashQrUrl || null,
      maya_qr_url: store.mayaQrUrl || null,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('store_settings').upsert(payload);
    if (error) console.error('[Supabase Store Settings Sync] Error:', error);
    else console.log('[Supabase Store Settings Sync] Store settings updated in Supabase.');
  } catch (err) {
    console.error('[Supabase Store Settings Sync] Exception:', err);
  }
}

/**
 * Sets up a persistent Realtime subscription to all Supabase tables so that any changes made
 * directly in Supabase (via Table Editor, SQL Editor, or external tools) are immediately
 * applied to the server's in-memory cache and broadcast to all connected web clients.
 */
export function setupSupabaseRealtime(
  state: {
    users: any[];
    customers: any[];
    products: any[];
    productRecipes: any[];
    productUpsizeRecipes: any[];
    inventory: any[];
    transactions: any[];
    onlineOrders: any[];
    storeInfo: any;
    categories: any[];
  },
  onBroadcast: (payload: { table: string; eventType: string; new: any; old: any }) => void
) {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[Supabase Realtime] Skipped: Supabase client not configured.');
    return null;
  }

  try {
    console.log('[Supabase Realtime] Establishing live subscription to Supabase database changes...');

    const channel = supabase
      .channel('server-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const { table, eventType } = payload;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          console.log(`[Supabase Realtime Event] ${eventType} on table "${table}":`, newRow?.id || oldRow?.id);

          try {
            // 1. Products
            if (table === 'products') {
              if (eventType === 'DELETE' && oldRow?.id) {
                const idx = state.products.findIndex(p => p.id === oldRow.id);
                if (idx !== -1) {
                  state.products.splice(idx, 1);
                  console.log(`[Supabase Realtime] Removed product ${oldRow.id} from in-memory state.`);
                }
              } else if (newRow && newRow.id) {
                const existing = state.products.find(p => p.id === newRow.id);
                if (existing) {
                  existing.name = newRow.name ?? existing.name;
                  existing.categoryId = newRow.category_id ?? existing.categoryId;
                  existing.price = newRow.price !== undefined ? Number(newRow.price) : existing.price;
                  existing.upsizePrice = newRow.upsize_price !== undefined ? (newRow.upsize_price !== null ? Number(newRow.upsize_price) : null) : existing.upsizePrice;
                  existing.imageUrl = newRow.image_url ?? existing.imageUrl;
                  existing.isAvailable = newRow.is_available !== undefined ? newRow.is_available : existing.isAvailable;
                  existing.productType = newRow.product_type ?? existing.productType;
                  existing.isArchived = newRow.is_archived !== undefined ? newRow.is_archived : existing.isArchived;
                  console.log(`[Supabase Realtime] Updated product "${existing.name}" in in-memory state.`);
                } else {
                  state.products.push({
                    id: newRow.id,
                    name: newRow.name,
                    categoryId: newRow.category_id,
                    price: Number(newRow.price) || 0,
                    upsizePrice: newRow.upsize_price ? Number(newRow.upsize_price) : null,
                    imageUrl: newRow.image_url,
                    isAvailable: newRow.is_available !== undefined ? newRow.is_available : true,
                    productType: newRow.product_type || 'Drink',
                    isArchived: newRow.is_archived || false,
                    createdAt: newRow.created_at || new Date().toISOString()
                  });
                  console.log(`[Supabase Realtime] Added new product "${newRow.name}" to in-memory state.`);
                }
              }
            }

            // 2. Inventory
            else if (table === 'inventory') {
              if (eventType === 'DELETE' && oldRow?.id) {
                const idx = state.inventory.findIndex(i => i.id === oldRow.id);
                if (idx !== -1) {
                  state.inventory.splice(idx, 1);
                  console.log(`[Supabase Realtime] Removed inventory item ${oldRow.id} from in-memory state.`);
                }
              } else if (newRow && newRow.id) {
                const existing = state.inventory.find(i => i.id === newRow.id);
                if (existing) {
                  existing.name = newRow.name ?? existing.name;
                  existing.unit = newRow.unit ?? existing.unit;
                  existing.currentStock = newRow.current_stock !== undefined ? Number(newRow.current_stock) : existing.currentStock;
                  existing.criticalLevel = newRow.critical_level !== undefined ? Number(newRow.critical_level) : existing.criticalLevel;
                  existing.category = newRow.category ?? existing.category;
                  existing.unitCost = newRow.unit_cost !== undefined ? Number(newRow.unit_cost) : existing.unitCost;
                  existing.supplierName = newRow.supplier_name ?? existing.supplierName;
                  existing.isArchived = newRow.is_archived !== undefined ? newRow.is_archived : existing.isArchived;
                  existing.updatedAt = newRow.updated_at || new Date().toISOString();
                  console.log(`[Supabase Realtime] Updated inventory "${existing.name}" (stock: ${existing.currentStock}) in in-memory state.`);
                } else {
                  state.inventory.push({
                    id: newRow.id,
                    name: newRow.name,
                    unit: newRow.unit,
                    currentStock: Number(newRow.current_stock) || 0,
                    criticalLevel: Number(newRow.critical_level) || 0,
                    category: newRow.category,
                    unitCost: Number(newRow.unit_cost) || 0,
                    supplierName: newRow.supplier_name,
                    isArchived: newRow.is_archived || false,
                    updatedAt: newRow.updated_at || new Date().toISOString()
                  });
                  console.log(`[Supabase Realtime] Added new inventory item "${newRow.name}" to in-memory state.`);
                }
              }
            }

            // 3. Categories
            else if (table === 'categories') {
              if (eventType === 'DELETE' && oldRow?.id) {
                const idx = state.categories.findIndex(c => c.id === oldRow.id);
                if (idx !== -1) state.categories.splice(idx, 1);
              } else if (newRow && newRow.id) {
                const existing = state.categories.find(c => c.id === newRow.id);
                if (existing) {
                  existing.name = newRow.name ?? existing.name;
                  existing.isArchived = newRow.is_archived ?? existing.isArchived;
                } else {
                  state.categories.push({
                    id: newRow.id,
                    name: newRow.name,
                    isArchived: newRow.is_archived || false
                  });
                }
              }
            }

            // 4. Users (Staff and Customers)
            else if (table === 'users') {
              if (eventType === 'DELETE' && oldRow?.id) {
                const uIdx = state.users.findIndex(u => u.id === oldRow.id);
                if (uIdx !== -1) state.users.splice(uIdx, 1);
                const cIdx = state.customers.findIndex(c => c.id === oldRow.id);
                if (cIdx !== -1) state.customers.splice(cIdx, 1);
              } else if (newRow && newRow.id) {
                if (newRow.role === 'Customer') {
                  const existing = state.customers.find(c => c.id === newRow.id || (c.email && newRow.email && c.email.toLowerCase() === newRow.email.toLowerCase()));
                  if (existing) {
                    existing.fullName = newRow.full_name || existing.fullName;
                    existing.username = newRow.username || existing.username;
                    existing.email = newRow.email || existing.email;
                    existing.phone = newRow.phone || existing.phone;
                    existing.passwordHash = newRow.password_hash || existing.passwordHash;
                    existing.address = newRow.address || existing.address;
                    existing.loyaltyPoints = newRow.loyalty_points !== undefined ? newRow.loyalty_points : existing.loyaltyPoints;
                    existing.isEmailVerified = newRow.is_email_verified !== undefined ? newRow.is_email_verified : existing.isEmailVerified;
                    existing.isPhoneVerified = newRow.is_phone_verified !== undefined ? newRow.is_phone_verified : existing.isPhoneVerified;
                  } else {
                    state.customers.push({
                      id: newRow.id,
                      fullName: newRow.full_name || newRow.username,
                      username: newRow.username,
                      email: newRow.email || '',
                      phone: newRow.phone || '',
                      passwordHash: newRow.password_hash || '',
                      address: newRow.address || '',
                      loyaltyPoints: newRow.loyalty_points || 0,
                      isEmailVerified: newRow.is_email_verified || false,
                      isPhoneVerified: newRow.is_phone_verified || false,
                      createdAt: newRow.created_at || new Date().toISOString()
                    });
                  }
                } else {
                  const existing = state.users.find(u => u.id === newRow.id || u.username.toLowerCase() === newRow.username.toLowerCase());
                  if (existing) {
                    existing.fullName = newRow.full_name || existing.fullName;
                    existing.username = newRow.username || existing.username;
                    existing.email = newRow.email || existing.email;
                    existing.phone = newRow.phone || existing.phone;
                    existing.passwordHash = newRow.password_hash || existing.passwordHash;
                    existing.role = newRow.role || existing.role;
                    existing.isActive = newRow.is_active !== undefined ? newRow.is_active : existing.isActive;
                  } else {
                    state.users.push({
                      id: newRow.id,
                      fullName: newRow.full_name || newRow.username,
                      username: newRow.username,
                      email: newRow.email,
                      phone: newRow.phone,
                      passwordHash: newRow.password_hash || '',
                      role: newRow.role || 'Cashier',
                      isActive: newRow.is_active !== undefined ? newRow.is_active : true,
                      createdAt: newRow.created_at || new Date().toISOString()
                    });
                  }
                }
              }
            }

            // 5. Store Settings
            else if (table === 'store_settings') {
              if (newRow) {
                if (newRow.store_name) state.storeInfo.name = newRow.store_name;
                if (newRow.address) state.storeInfo.address = newRow.address;
                if (newRow.phone) state.storeInfo.phone = newRow.phone;
                if (newRow.email) state.storeInfo.email = newRow.email;
                if (newRow.opening_time && newRow.closing_time) {
                  state.storeInfo.hours = `Monday to Sunday: ${newRow.opening_time} - ${newRow.closing_time}`;
                }
                if (newRow.announcement) state.storeInfo.aboutText = newRow.announcement;
                if (newRow.gcash_qr_url) state.storeInfo.gcashQrUrl = newRow.gcash_qr_url;
                if (newRow.maya_qr_url) state.storeInfo.mayaQrUrl = newRow.maya_qr_url;
                console.log('[Supabase Realtime] Updated store settings in in-memory state.');
              }
            }

            // 6. Online Orders
            else if (table === 'online_orders') {
              if (newRow && newRow.id) {
                const existing = state.onlineOrders.find(o => o.id === newRow.id || o.orderRef === newRow.order_ref);
                if (existing) {
                  existing.status = newRow.status || existing.status;
                  existing.cancelReason = newRow.cancel_reason || existing.cancelReason;
                  existing.cancelledAt = newRow.cancelled_at || existing.cancelledAt;
                  existing.deliveryAddress = newRow.customer_address || existing.deliveryAddress;
                  existing.totalAmount = newRow.total_amount !== undefined ? Number(newRow.total_amount) : existing.totalAmount;
                } else {
                  state.onlineOrders.unshift({
                    id: newRow.id,
                    orderRef: newRow.order_ref,
                    customerId: newRow.customer_id,
                    customerName: newRow.customer_name,
                    customerPhone: newRow.customer_phone,
                    deliveryAddress: newRow.customer_address,
                    paymentMethod: newRow.payment_method || 'GCash',
                    orderType: newRow.delivery_type || 'Pickup',
                    items: Array.isArray(newRow.items) ? newRow.items : [],
                    subtotal: Number(newRow.subtotal) || 0,
                    deliveryFee: Number(newRow.delivery_fee) || 0,
                    loyaltyDiscount: Number(newRow.loyalty_discount) || 0,
                    loyaltyPointsRedeemed: Number(newRow.loyalty_points_redeemed) || 0,
                    totalAmount: Number(newRow.total_amount) || 0,
                    inventoryDeducted: Boolean(newRow.inventory_deducted),
                    status: newRow.status || 'Pending',
                    notes: newRow.notes,
                    createdAt: newRow.created_at || new Date().toISOString()
                  });
                }
              }
            }
          } catch (innerErr) {
            console.error('[Supabase Realtime] Error applying update to state:', innerErr);
          }

          // Forward to all connected clients
          onBroadcast({
            table,
            eventType,
            new: newRow,
            old: oldRow
          });
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Server subscription status:', status);
      });

    return channel;
  } catch (err) {
    console.error('[Supabase Realtime] Failed to setup realtime subscription:', err);
    return null;
  }
}

/**
 * Polls Supabase on a 2.5s interval to ensure that ANY direct manual edit made
 * in Supabase Studio / Table Editor is immediately detected, reconciled into in-memory state,
 * and pushed live to the website without requiring page refresh.
 */
export function startContinuousSupabaseSync(
  state: {
    users: any[];
    customers: any[];
    products: any[];
    productRecipes: any[];
    productUpsizeRecipes: any[];
    inventory: any[];
    transactions: any[];
    onlineOrders: any[];
    storeInfo: any;
    categories: any[];
  },
  onBroadcast: (payload: { table: string; eventType: string; new?: any; old?: any }) => void,
  intervalMs = 2500
) {
  if (!isSupabaseConfigured() || !supabase) return;
  const client = supabase;

  let isSyncing = false;

  const pollInterval = setInterval(async () => {
    if (isSyncing) return;
    isSyncing = true;
    try {

         // 1. Check Products
      const { data: dbProducts } = await client
        .from('products')
        .select('id, name, category_id, price, upsize_price, is_available, product_type, is_archived, created_at');
      if (dbProducts && Array.isArray(dbProducts)) {
        let changed = false;
        for (const p of dbProducts) {
          const existing = state.products.find(prod => prod.id === p.id);
          const priceNum = Number(p.price);
          const upsizePriceNum = p.upsize_price !== null && p.upsize_price !== undefined ? Number(p.upsize_price) : null;
          const isAvail = p.is_available !== undefined ? p.is_available : true;

          if (existing) {
            if (
              existing.name !== p.name ||
              existing.price !== priceNum ||
              existing.upsizePrice !== upsizePriceNum ||
              existing.isAvailable !== isAvail ||
              existing.categoryId !== p.category_id ||
              existing.isArchived !== Boolean(p.is_archived)
            ) {
              existing.name = p.name;
              existing.price = priceNum;
              existing.upsizePrice = upsizePriceNum;
              existing.isAvailable = isAvail;
              existing.categoryId = p.category_id;
              existing.isArchived = Boolean(p.is_archived);
              changed = true;
              console.log(`[Supabase Continuous Sync] Product modified in Supabase: "${p.name}" (price: ₱${priceNum}, avail: ${isAvail})`);
            }
          } else {
            const { data: imgRow } = await client.from('products').select('image_url').eq('id', p.id).maybeSingle();
            state.products.push({
              id: p.id,
              name: p.name,
              categoryId: p.category_id,
              price: priceNum,
              upsizePrice: upsizePriceNum,
              imageUrl: imgRow?.image_url,
              isAvailable: isAvail,
              productType: p.product_type || 'Drink',
              isArchived: Boolean(p.is_archived),
              createdAt: p.created_at || new Date().toISOString()
            });
            changed = true;
            console.log(`[Supabase Continuous Sync] New product found in Supabase: "${p.name}"`);
          }
        }
        if (changed) {
          onBroadcast({ table: 'products', eventType: 'UPDATE' });
        }
      }

      // 2. Check Inventory
      const { data: dbInv } = await client.from('inventory').select('*');
      if (dbInv && Array.isArray(dbInv)) {
        let changed = false;
        for (const inv of dbInv) {
          const existing = state.inventory.find(i => i.id === inv.id);
          const currentStock = Number(inv.current_stock);
          const criticalLevel = Number(inv.critical_level);

          if (existing) {
            if (
              existing.name !== inv.name ||
              existing.currentStock !== currentStock ||
              existing.criticalLevel !== criticalLevel ||
              existing.unit !== inv.unit ||
              existing.isArchived !== Boolean(inv.is_archived)
            ) {
              existing.name = inv.name;
              existing.currentStock = currentStock;
              existing.criticalLevel = criticalLevel;
              existing.unit = inv.unit;
              existing.isArchived = Boolean(inv.is_archived);
              changed = true;
              console.log(`[Supabase Continuous Sync] Inventory modified in Supabase: "${inv.name}" -> stock: ${currentStock}`);
            }
          } else {
            state.inventory.push({
              id: inv.id,
              name: inv.name,
              unit: inv.unit,
              currentStock,
              criticalLevel,
              category: inv.category,
              unitCost: Number(inv.unit_cost) || 0,
              supplierName: inv.supplier_name,
              isArchived: Boolean(inv.is_archived),
              updatedAt: inv.updated_at || new Date().toISOString()
            });
            changed = true;
            console.log(`[Supabase Continuous Sync] New inventory item found in Supabase: "${inv.name}"`);
          }
        }
        if (changed) {
          onBroadcast({ table: 'inventory', eventType: 'UPDATE' });
        }
      }

      // 3. Check Categories
      const { data: dbCats } = await client.from('categories').select('*');
      if (dbCats && Array.isArray(dbCats)) {
        let changed = false;
        for (const cat of dbCats) {
          const existing = state.categories.find(c => c.id === cat.id);
          if (existing) {
            if (existing.name !== cat.name || existing.isArchived !== Boolean(cat.is_archived)) {
              existing.name = cat.name;
              existing.isArchived = Boolean(cat.is_archived);
              changed = true;
            }
          } else {
            state.categories.push({
              id: cat.id,
              name: cat.name,
              isArchived: Boolean(cat.is_archived)
            });
            changed = true;
          }
        }
        if (changed) {
          onBroadcast({ table: 'categories', eventType: 'UPDATE' });
        }
      }

      // 4. Check Store Settings
      const { data: dbStore } = await client.from('store_settings').select('*').limit(1);
      if (dbStore && dbStore[0]) {
        const s = dbStore[0];
        let changed = false;
        if (s.store_name && state.storeInfo.name !== s.store_name) {
          state.storeInfo.name = s.store_name;
          changed = true;
        }
        if (s.address && state.storeInfo.address !== s.address) {
          state.storeInfo.address = s.address;
          changed = true;
        }
        if (s.phone && state.storeInfo.phone !== s.phone) {
          state.storeInfo.phone = s.phone;
          changed = true;
        }
        if (s.email && state.storeInfo.email !== s.email) {
          state.storeInfo.email = s.email;
          changed = true;
        }
        if (s.announcement && state.storeInfo.aboutText !== s.announcement) {
          state.storeInfo.aboutText = s.announcement;
          changed = true;
        }
        if (s.gcash_qr_url && state.storeInfo.gcashQrUrl !== s.gcash_qr_url) {
          state.storeInfo.gcashQrUrl = s.gcash_qr_url;
          changed = true;
        }
        if (s.maya_qr_url && state.storeInfo.mayaQrUrl !== s.maya_qr_url) {
          state.storeInfo.mayaQrUrl = s.maya_qr_url;
          changed = true;
        }
        if (changed) {
          onBroadcast({ table: 'store_settings', eventType: 'UPDATE' });
        }
      }

      // 5. Check Online Orders
      const { data: dbOrders } = await client.from('online_orders').select('*').order('created_at', { ascending: false }).limit(50);
      if (dbOrders && Array.isArray(dbOrders)) {
        let changed = false;
        for (const o of dbOrders) {
          const existing = state.onlineOrders.find(ord => ord.id === o.id || ord.orderRef === o.order_ref);
          if (existing) {
            if (existing.status !== o.status || existing.totalAmount !== Number(o.total_amount)) {
              existing.status = o.status;
              existing.totalAmount = Number(o.total_amount);
              changed = true;
              console.log(`[Supabase Continuous Sync] Order ${o.order_ref} status changed in Supabase to "${o.status}"`);
            }
          }
        }
        if (changed) {
          onBroadcast({ table: 'online_orders', eventType: 'UPDATE' });
        }
      }
    } catch (err) {
      // transient network error
    } finally {
      isSyncing = false;
    }
  }, intervalMs);

  return pollInterval;
}