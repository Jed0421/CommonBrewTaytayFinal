-- CommonBrew Taytay - Complete Supabase Database Schema
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory / Raw Materials Table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
  critical_level DOUBLE PRECISION NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT 'General',
  unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  supplier_name TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inventory Change Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id TEXT PRIMARY KEY,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  quantity_change DOUBLE PRECISION NOT NULL,
  note TEXT,
  performed_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  price DOUBLE PRECISION NOT NULL,
  upsize_price DOUBLE PRECISION,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  product_type TEXT NOT NULL DEFAULT 'Drink',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Product Regular Recipes Table
CREATE TABLE IF NOT EXISTS product_recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Product Upsize Recipes Table
CREATE TABLE IF NOT EXISTS product_upsize_recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Users & Customer Accounts Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Customer',
  password_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transactions (POS Sales) Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  ref_code TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION DEFAULT 0,
  discount_type TEXT,
  total DOUBLE PRECISION NOT NULL,
  amount_tendered DOUBLE PRECISION NOT NULL,
  change_amount DOUBLE PRECISION NOT NULL,
  payment_method TEXT NOT NULL,
  cashier_name TEXT NOT NULL,
  is_voided BOOLEAN DEFAULT FALSE,
  void_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Online Orders Table
CREATE TABLE IF NOT EXISTS online_orders (
  id TEXT PRIMARY KEY,
  order_ref TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'delivery',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DOUBLE PRECISION NOT NULL,
  delivery_fee DOUBLE PRECISION DEFAULT 0,
  loyalty_discount DOUBLE PRECISION DEFAULT 0,
  loyalty_points_redeemed INTEGER DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL,
  inventory_deducted BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  is_store_open BOOLEAN DEFAULT TRUE,
  announcement TEXT,
  gcash_qr_url TEXT,
  maya_qr_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies or leave open for service role
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_upsize_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access & service-role full access
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read categories" ON categories;
  CREATE POLICY "Public read categories" ON categories FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read inventory" ON inventory;
  CREATE POLICY "Public read inventory" ON inventory FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read inventory_logs" ON inventory_logs;
  CREATE POLICY "Public read inventory_logs" ON inventory_logs FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read products" ON products;
  CREATE POLICY "Public read products" ON products FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read product_recipes" ON product_recipes;
  CREATE POLICY "Public read product_recipes" ON product_recipes FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read product_upsize_recipes" ON product_upsize_recipes;
  CREATE POLICY "Public read product_upsize_recipes" ON product_upsize_recipes FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read users" ON users;
  CREATE POLICY "Public read users" ON users FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read transactions" ON transactions;
  CREATE POLICY "Public read transactions" ON transactions FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read online_orders" ON online_orders;
  CREATE POLICY "Public read online_orders" ON online_orders FOR ALL USING (true);

  DROP POLICY IF EXISTS "Public read store_settings" ON store_settings;
  CREATE POLICY "Public read store_settings" ON store_settings FOR ALL USING (true);
END $$;
