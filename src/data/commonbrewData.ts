import type { CategoryRecord, InventoryRecord, ProductRecord, ProductRecipeRecord } from '../types.ts';

export const commonbrewCategories: CategoryRecord[] = [
  { id: 'cat-milktea', name: 'Milktea Series' },
  { id: 'cat-matcha', name: 'Matcha Series' },
  { id: 'cat-coffee', name: 'Iced Coffee Series' },
  { id: 'cat-hotcoffee', name: 'Hot Coffee Series' },
  { id: 'cat-fruittea', name: 'Fruit Tea Series' },
  { id: 'cat-frappe', name: 'Frappe Series' },
  { id: 'cat-soda', name: 'Soda Series (Fruit Fizz)' },
  { id: 'cat-ube', name: 'Ube Series' },
  { id: 'cat-snacks', name: 'Snacks' },
  { id: 'cat-pastries', name: 'Pastries' },
];

export const commonbrewInventory: InventoryRecord[] = [
  { id: 'inv-1', name: 'Assam Tea Base', unit: 'ml', currentStock: 10000, criticalLevel: 2000, category: 'Tea & Base', unitCost: 0.05, supplierName: 'CommonBrew Tea Co.', updatedAt: new Date().toISOString() },
  { id: 'inv-2', name: 'Espresso Shot Base', unit: 'cc', currentStock: 8000, criticalLevel: 1500, category: 'Coffee Beans', unitCost: 0.50, supplierName: 'Benguet Arabica Co.', updatedAt: new Date().toISOString() },
  { id: 'inv-3', name: 'Full Cream Milk', unit: 'g', currentStock: 25000, criticalLevel: 5000, category: 'Dairy & Milk', unitCost: 0.10, supplierName: 'Batangas Fresh Dairy', updatedAt: new Date().toISOString() },
  { id: 'inv-4', name: 'Condensed Milk', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Dairy & Milk', unitCost: 0.12, supplierName: 'Nestle PH', updatedAt: new Date().toISOString() },
  { id: 'inv-5', name: 'Non-Dairy Creamer', unit: 'g', currentStock: 8000, criticalLevel: 1500, category: 'Powders', unitCost: 0.15, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-6', name: 'Sugar Syrup / Sweetener', unit: 'pump', currentStock: 3000, criticalLevel: 500, category: 'Syrups', unitCost: 0.20, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-7', name: 'Matcha Powder (Uji Grade)', unit: 'g', currentStock: 4000, criticalLevel: 800, category: 'Powders', unitCost: 1.20, supplierName: 'Kyoto Tea Imports', updatedAt: new Date().toISOString() },
  { id: 'inv-8', name: 'Cream Cheese Walling', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Toppings & Add-ons', unitCost: 0.60, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-9', name: 'Tapioca Pearls', unit: 'scoop', currentStock: 1500, criticalLevel: 300, category: 'Toppings & Add-ons', unitCost: 2.00, supplierName: 'Boba Trade Supply', updatedAt: new Date().toISOString() },
  { id: 'inv-10', name: 'Frappe Base Powder', unit: 'g', currentStock: 8000, criticalLevel: 1500, category: 'Powders', unitCost: 0.30, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-11', name: 'Whipped Cream Powder', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Toppings & Add-ons', unitCost: 0.40, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-12', name: 'Nata De Coco', unit: 'scoop', currentStock: 1500, criticalLevel: 300, category: 'Toppings & Add-ons', unitCost: 1.50, supplierName: 'Boba Trade Supply', updatedAt: new Date().toISOString() },
  { id: 'inv-13', name: 'Fresh Lemon Slices', unit: 'slice', currentStock: 500, criticalLevel: 100, category: 'Fresh Fruit', unitCost: 1.00, supplierName: 'Rizal Fresh Produce', updatedAt: new Date().toISOString() },
  { id: 'inv-14', name: 'Schweppes Soda Water', unit: 'g', currentStock: 15000, criticalLevel: 3000, category: 'Beverages', unitCost: 0.12, supplierName: 'Coca-Cola Beverages', updatedAt: new Date().toISOString() },
  { id: 'inv-15', name: 'Strawberry Jam / Syrup', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-16', name: 'Ube Powder', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Powders', unitCost: 0.50, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-17', name: 'Wintermelon Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.30, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-18', name: 'Brown Sugar Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.30, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-19', name: 'Cookies & Cream Powder', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Powders', unitCost: 0.40, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-20', name: 'Black Charcoal Powder', unit: 'g', currentStock: 3000, criticalLevel: 600, category: 'Powders', unitCost: 0.60, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-21', name: 'Thai Tea Powder', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Powders', unitCost: 0.40, supplierName: 'Baking Depot Rizal', updatedAt: new Date().toISOString() },
  { id: 'inv-22', name: 'Chocolate Powder / Syrup', unit: 'g', currentStock: 5000, criticalLevel: 1000, category: 'Powders', unitCost: 0.35, supplierName: 'Davao Cacao Trade', updatedAt: new Date().toISOString() },
  { id: 'inv-23', name: 'Caramel Syrup / Powder', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-24', name: 'Salted Caramel Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-25', name: 'Butterscotch Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-26', name: 'White Chocolate Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-27', name: 'French Vanilla Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-28', name: 'Hazelnut Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-29', name: 'Crème Brulee Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.40, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-30', name: 'Creamy Coconut Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.40, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-31', name: 'Passionfruit Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-32', name: 'Peach Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-33', name: 'Sweet Grapes Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-34', name: 'Lemon Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-35', name: 'Green Apple Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-36', name: 'Kiwi Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-37', name: 'Lychee Syrup', unit: 'cc', currentStock: 5000, criticalLevel: 1000, category: 'Syrups & Flavors', unitCost: 0.35, supplierName: 'Monin PH', updatedAt: new Date().toISOString() },
  { id: 'inv-38', name: '16oz Cold Cup & Seal (Normal Size Cup)', unit: 'pcs', currentStock: 2000, criticalLevel: 400, category: 'Packaging & Cups', unitCost: 3.50, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-39', name: '22oz Cold Cup & Seal (Upsize Cup)', unit: 'pcs', currentStock: 2000, criticalLevel: 400, category: 'Packaging & Cups', unitCost: 4.20, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-40', name: 'Dome Lid (Frappe)', unit: 'pcs', currentStock: 1000, criticalLevel: 200, category: 'Packaging & Cups', unitCost: 1.50, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-41', name: '12oz Hot Paper Cup & Lid (Normal Size Cup)', unit: 'pcs', currentStock: 2000, criticalLevel: 400, category: 'Packaging & Cups', unitCost: 3.80, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-55', name: 'Drinking Straw', unit: 'pcs', currentStock: 3000, criticalLevel: 500, category: 'Packaging & Cups', unitCost: 0.50, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-56', name: '16oz Hot Paper Cup & Lid (Upsize)', unit: 'pcs', currentStock: 2000, criticalLevel: 400, category: 'Packaging & Cups', unitCost: 4.50, supplierName: 'EcoPack Plastics Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-42', name: 'Nacho Chips & Cheese Dip', unit: 'serving', currentStock: 200, criticalLevel: 30, category: 'Snack Ingredients', unitCost: 25.00, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-43', name: 'Burger Patties & Buns', unit: 'pc', currentStock: 300, criticalLevel: 50, category: 'Snack Ingredients', unitCost: 20.00, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-44', name: 'Cheese Slices', unit: 'slice', currentStock: 500, criticalLevel: 100, category: 'Snack Ingredients', unitCost: 5.00, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-45', name: 'French Fries (Frozen)', unit: 'g', currentStock: 20000, criticalLevel: 3000, category: 'Snack Ingredients', unitCost: 0.20, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-46', name: 'Cheese Powder Seasoning', unit: 'g', currentStock: 3000, criticalLevel: 500, category: 'Snack Ingredients', unitCost: 0.30, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-47', name: 'Sour Cream Powder Seasoning', unit: 'g', currentStock: 3000, criticalLevel: 500, category: 'Snack Ingredients', unitCost: 0.30, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-48', name: 'Barbeque Powder Seasoning', unit: 'g', currentStock: 3000, criticalLevel: 500, category: 'Snack Ingredients', unitCost: 0.30, supplierName: 'Food Wholesale Taytay', updatedAt: new Date().toISOString() },
  { id: 'inv-49', name: 'Chicken Floss Pastry Stock', unit: 'pc', currentStock: 100, criticalLevel: 20, category: 'Pastries', unitCost: 35.00, supplierName: 'CommonBrew Bakery', updatedAt: new Date().toISOString() },
  { id: 'inv-50', name: 'Cinnamon Roll Stock', unit: 'pc', currentStock: 100, criticalLevel: 20, category: 'Pastries', unitCost: 35.00, supplierName: 'CommonBrew Bakery', updatedAt: new Date().toISOString() },
  { id: 'inv-51', name: 'Ube Cheese Bread Stock', unit: 'pc', currentStock: 100, criticalLevel: 20, category: 'Pastries', unitCost: 40.00, supplierName: 'CommonBrew Bakery', updatedAt: new Date().toISOString() },
  { id: 'inv-52', name: 'Bavarian Ensaymada Stock', unit: 'pc', currentStock: 100, criticalLevel: 20, category: 'Pastries', unitCost: 40.00, supplierName: 'CommonBrew Bakery', updatedAt: new Date().toISOString() },
  { id: 'inv-53', name: 'Dulce Ensaymada Stock', unit: 'pc', currentStock: 100, criticalLevel: 20, category: 'Pastries', unitCost: 40.00, supplierName: 'CommonBrew Bakery', updatedAt: new Date().toISOString() },
  { id: 'inv-54', name: 'Coffee Jelly', unit: 'scoop', currentStock: 1500, criticalLevel: 300, category: 'Toppings & Add-ons', unitCost: 1.50, supplierName: 'Boba Trade Supply', updatedAt: new Date().toISOString() },
];

export interface AddonOption {
  name: string;
  price: number;
}

export const commonbrewAddons: AddonOption[] = [
  { name: 'Coffee Jelly', price: 10 },
  { name: 'Tapioca Pearl', price: 10 },
  { name: 'Nata de Coco', price: 10 },
  { name: 'Espresso Shot', price: 15 },
  { name: 'Cream Cheese', price: 15 },
  { name: 'Whipped Cream', price: 20 },
];

/**
 * Returns allowed add-on options based on the product category or type:
 * - Snacks & Pastries: No add-ons
 * - Hot Coffee Series: No add-ons
 * - Fruit Tea Series & Soda Series: Only 'Nata de Coco'
 * - Other drink series: All standard add-ons
 */
export const getAvailableAddonsForProduct = (
  productOrCategory?: { categoryId?: string | null; productType?: string | null; name?: string | null } | string | null
): AddonOption[] => {
  if (!productOrCategory) return commonbrewAddons;

  let categoryId = '';
  let productType = '';
  let name = '';

  if (typeof productOrCategory === 'string') {
    categoryId = productOrCategory;
  } else {
    categoryId = productOrCategory.categoryId || '';
    productType = productOrCategory.productType || '';
    name = productOrCategory.name || '';
  }

  const catLower = categoryId.toLowerCase();
  const typeLower = productType.toLowerCase();
  const nameLower = name.toLowerCase();

  // 1. Snacks & Pastries -> No Add-ons
  if (
    catLower === 'cat-snacks' ||
    catLower === 'cat-pastries' ||
    typeLower === 'snack' ||
    typeLower === 'pastry' ||
    typeLower === 'food' ||
    catLower.includes('snack') ||
    catLower.includes('pastr')
  ) {
    return [];
  }

  // 2. Hot Coffee Series -> No Add-ons
  if (
    catLower === 'cat-hotcoffee' ||
    catLower.includes('hotcoffee') ||
    catLower.includes('hot coffee') ||
    (nameLower.startsWith('hot ') && !nameLower.includes('shot'))
  ) {
    return [];
  }

  // 3. Fruit Tea Series & Soda Series -> ONLY Nata de Coco
  if (
    catLower === 'cat-fruittea' ||
    catLower.includes('fruittea') ||
    catLower.includes('fruit tea') ||
    catLower === 'cat-soda' ||
    catLower.includes('soda') ||
    catLower.includes('fizz')
  ) {
    return commonbrewAddons.filter(a => a.name.toLowerCase() === 'nata de coco');
  }

  // 4. Other Cold Drinks (Milktea, Iced Coffee, Matcha, Frappe, Ube, etc.) -> Standard add-ons
  return commonbrewAddons;
};

export const getAddonPrice = (addonName: string): number => {
  const match = commonbrewAddons.find(a =>
    a.name.toLowerCase() === addonName.toLowerCase() ||
    addonName.toLowerCase().includes(a.name.toLowerCase()) ||
    a.name.toLowerCase().includes(addonName.toLowerCase())
  );
  if (match) return match.price;
  if (addonName.toLowerCase().includes('espresso')) return 15;
  if (addonName.toLowerCase().includes('cheese')) return 15;
  if (addonName.toLowerCase().includes('whipped')) return 20;
  if (addonName.toLowerCase().includes('pearl') || addonName.toLowerCase().includes('jelly') || addonName.toLowerCase().includes('nata')) return 10;
  return 15;
};

export const commonbrewProducts: ProductRecord[] = [
  // MILKTEA SERIES (80 / 90)
  {
    id: 'prod-mt-1',
    name: 'Wintermelon Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Wintermelon.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-2',
    name: 'Brown Sugar Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Brown Sugar.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-3',
    name: 'Classic Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Classic.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-4',
    name: 'Cookies & Cream Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Cookies and Cream.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-5',
    name: 'Black Charcoal Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Black Charcoal.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-6',
    name: 'Thai Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Thai.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-7',
    name: 'Chocolate Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Chocolate.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-mt-8',
    name: 'Caramel Milktea',
    categoryId: 'cat-milktea',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Caramel.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // MATCHA SERIES (100 / 110)
  {
    id: 'prod-ma-1',
    name: 'Matcha Latte',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Latte.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ma-2',
    name: 'Matcha Crème Brulee Latte',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Crème Brulee.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ma-3',
    name: 'Matcha Creamy Coconut Latte',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Creamy Coconut.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ma-4',
    name: 'Matcha Strawberry Latte',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Strawberry Latte.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ma-5',
    name: 'Matcha Frappe',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Frappe.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ma-6',
    name: 'Matcha Strawberry Frappe',
    categoryId: 'cat-matcha',
    price: 100,
    upsizePrice: 110,
    imageUrl: '/src/assets/images/Matcha Strawberry Frappe.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // ICED COFFEE SERIES (85 / 95)
  {
    id: 'prod-cf-1',
    name: 'Iced Salted Caramel Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Salted Caramel.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-2',
    name: 'Iced Butterscotch Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Butterscotch.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-3',
    name: 'Iced White Chocolate Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced White Chocolate.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-4',
    name: 'Iced French Vanilla Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced French Vanilla.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-5',
    name: 'Iced Hazelnut Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Hazelnut.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-6',
    name: 'Iced Caramel Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Caramel.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-7',
    name: 'Iced Chocolate Coffee',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Chocolate.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-8',
    name: 'Iced Spanish Latte',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Spanish Latte.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-cf-9',
    name: 'Iced Americano',
    categoryId: 'cat-coffee',
    price: 85,
    upsizePrice: 95,
    imageUrl: '/src/assets/images/Iced Americano.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // HOT COFFEE SERIES (80 / 90)
  {
    id: 'prod-hc-1',
    name: 'Hot Spanish Latte',
    categoryId: 'cat-hotcoffee',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Hot Spanish Latte.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-hc-2',
    name: 'Hot Café Mocha',
    categoryId: 'cat-hotcoffee',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Hot Café Mocha.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-hc-3',
    name: 'Hot Caramel Macchiato',
    categoryId: 'cat-hotcoffee',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Hot Caramel Macchiato.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-hc-4',
    name: 'Hot Americano',
    categoryId: 'cat-hotcoffee',
    price: 80,
    upsizePrice: 90,
    imageUrl: '/src/assets/images/Hot Americano.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // FRUIT TEA SERIES (70 / 80)
  {
    id: 'prod-ft-1',
    name: 'Lemon Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Lemon.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-2',
    name: 'Passionfruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Passionfruit.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-3',
    name: 'Green Apple Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Green Apple.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-4',
    name: 'Lychee Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Lychee.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-5',
    name: 'Strawberry Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Strawberry.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-6',
    name: 'Peach Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Peach.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-7',
    name: 'Blueberry Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Blueberry.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-8',
    name: 'Kiwi Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Kiwi.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ft-9',
    name: 'Sweet Grapes Fruit Tea',
    categoryId: 'cat-fruittea',
    price: 70,
    upsizePrice: 80,
    imageUrl: '/src/assets/images/Sweet Grapes.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // FRAPPE SERIES (95 / 105)
  {
    id: 'prod-fr-1',
    name: 'Strawberry Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FStrawberry.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-2',
    name: 'Vanilla Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FVanilla.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-3',
    name: 'Red Velvet Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FRed Velvet.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-4',
    name: 'Dark Chocolate Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FDark Chocolate.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-5',
    name: 'Hershey\'s Blend Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FHersheys Blend.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-6',
    name: 'Chocolate Truffles Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FChocolate Truffles.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-7',
    name: 'Mocha Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FMocha.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-8',
    name: 'Cappuccino Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FCappuccino.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-fr-9',
    name: 'Caramel Macchiato Frappe',
    categoryId: 'cat-frappe',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/FCaramel Macchiato.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // SODA SERIES (95)
  {
    id: 'prod-sd-1',
    name: 'Bliss Berry Fizz',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Bliss Berry Fizz.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-sd-2',
    name: 'Passion Zest',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Passion Zest.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-sd-3',
    name: 'Peachy Pop',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Peachy Pop.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-sd-4',
    name: 'Plum Fizz',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Plum Fizz.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-sd-5',
    name: 'Strawberry Zing',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Strawberry Zing.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-sd-6',
    name: 'Green Fizz',
    categoryId: 'cat-soda',
    price: 95,
    upsizePrice: null,
    imageUrl: '/src/assets/images/Soda Green Fizz.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // UBE SERIES (95 / 105)
  {
    id: 'prod-ub-1',
    name: 'Ube Latte',
    categoryId: 'cat-ube',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/Ube Latte.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ub-2',
    name: 'Ube Crème Brûlée',
    categoryId: 'cat-ube',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/Ube Crème Brûlée.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ub-3',
    name: 'Ube Creamy Coconut',
    categoryId: 'cat-ube',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/Ube Creamy Coconut.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-ub-4',
    name: 'Ube Frappe',
    categoryId: 'cat-ube',
    price: 95,
    upsizePrice: 105,
    imageUrl: '/src/assets/images/Ube Frappe.png',
    isAvailable: true,
    productType: 'Drink',
    createdAt: new Date().toISOString()
  },

  // SNACKS
  {
    id: 'prod-snk-1',
    name: 'Cheesy Nachos',
    categoryId: 'cat-snacks',
    price: 99,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Crispy tortilla chips smothered in warm, savory cheese sauce & seasoned toppings.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-snk-2',
    name: 'Cheeseburger',
    categoryId: 'cat-snacks',
    price: 70,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Juicy grilled patty topped with melted slice cheese, fresh veggies & special sauce on a toasted bun.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-snk-3',
    name: 'Regular Burger',
    categoryId: 'cat-snacks',
    price: 60,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Classic beef burger with house dressing and onions on a warm toasted bun.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-snk-4',
    name: 'French Fries (Cheese)',
    categoryId: 'cat-snacks',
    price: 90,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Crispy golden potato fries tossed in savory cheese seasoning.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-snk-5',
    name: 'French Fries (Sour Cream)',
    categoryId: 'cat-snacks',
    price: 90,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Crispy golden potato fries tossed in tangy sour cream seasoning.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-snk-6',
    name: 'French Fries (Barbeque)',
    categoryId: 'cat-snacks',
    price: 90,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Crispy golden potato fries tossed in smoky barbeque flavor seasoning.',
    createdAt: new Date().toISOString()
  },

  // PASTRIES
  {
    id: 'prod-pst-1',
    name: 'Chicken Floss',
    categoryId: 'cat-pastries',
    price: 65,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Soft savory bun coated with sweet mayo glaze and topped generously with chicken floss.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-pst-2',
    name: 'Cinnamon Roll',
    categoryId: 'cat-pastries',
    price: 65,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Warm freshly baked cinnamon swirl roll topped with sweet cream glaze.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-pst-3',
    name: 'Ube Cheese',
    categoryId: 'cat-pastries',
    price: 70,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Soft ube bread stuffed with rich ube halaya & creamy cheese chunk.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-pst-4',
    name: 'Bavarian Ensaymada',
    categoryId: 'cat-pastries',
    price: 70,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1621236378699-8597faf6a14d?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Filipino sweet ensaymada filled with custard Bavarian cream and topped with butter & grated cheese.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-pst-5',
    name: 'Dulce Ensaymada',
    categoryId: 'cat-pastries',
    price: 70,
    upsizePrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    productType: 'Food',
    description: 'Decadent ensaymada layered with rich dulce de leche caramel and savory cheese toppings.',
    createdAt: new Date().toISOString()
  }
];

export const commonbrewProductRecipes: ProductRecipeRecord[] = [
  // Wintermelon Milktea 16oz
  { id: 'r-mt1-1', productId: 'prod-mt-1', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt1-2', productId: 'prod-mt-1', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt1-3', productId: 'prod-mt-1', inventoryItemId: 'inv-17', quantity: 20 },
  { id: 'r-mt1-4', productId: 'prod-mt-1', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt1-5', productId: 'prod-mt-1', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt1-6', productId: 'prod-mt-1', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt1-7', productId: 'prod-mt-1', inventoryItemId: 'inv-38', quantity: 1 },

  // Brown Sugar Milktea 16oz
  { id: 'r-mt2-1', productId: 'prod-mt-2', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt2-2', productId: 'prod-mt-2', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt2-3', productId: 'prod-mt-2', inventoryItemId: 'inv-18', quantity: 20 },
  { id: 'r-mt2-4', productId: 'prod-mt-2', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt2-5', productId: 'prod-mt-2', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt2-6', productId: 'prod-mt-2', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt2-7', productId: 'prod-mt-2', inventoryItemId: 'inv-38', quantity: 1 },

  // Classic Milktea 16oz
  { id: 'r-mt3-1', productId: 'prod-mt-3', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt3-2', productId: 'prod-mt-3', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt3-3', productId: 'prod-mt-3', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt3-4', productId: 'prod-mt-3', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt3-5', productId: 'prod-mt-3', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt3-6', productId: 'prod-mt-3', inventoryItemId: 'inv-38', quantity: 1 },

  // Cookies & Cream Milktea 16oz
  { id: 'r-mt4-1', productId: 'prod-mt-4', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt4-2', productId: 'prod-mt-4', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt4-3', productId: 'prod-mt-4', inventoryItemId: 'inv-19', quantity: 30 },
  { id: 'r-mt4-4', productId: 'prod-mt-4', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt4-5', productId: 'prod-mt-4', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt4-6', productId: 'prod-mt-4', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt4-7', productId: 'prod-mt-4', inventoryItemId: 'inv-38', quantity: 1 },

  // Black Charcoal Milktea 16oz
  { id: 'r-mt5-1', productId: 'prod-mt-5', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt5-2', productId: 'prod-mt-5', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt5-3', productId: 'prod-mt-5', inventoryItemId: 'inv-20', quantity: 30 },
  { id: 'r-mt5-4', productId: 'prod-mt-5', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt5-5', productId: 'prod-mt-5', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt5-6', productId: 'prod-mt-5', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt5-7', productId: 'prod-mt-5', inventoryItemId: 'inv-38', quantity: 1 },

  // Thai Milktea 16oz
  { id: 'r-mt6-1', productId: 'prod-mt-6', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt6-2', productId: 'prod-mt-6', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt6-3', productId: 'prod-mt-6', inventoryItemId: 'inv-21', quantity: 30 },
  { id: 'r-mt6-4', productId: 'prod-mt-6', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt6-5', productId: 'prod-mt-6', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt6-6', productId: 'prod-mt-6', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt6-7', productId: 'prod-mt-6', inventoryItemId: 'inv-38', quantity: 1 },

  // Chocolate Milktea 16oz
  { id: 'r-mt7-1', productId: 'prod-mt-7', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt7-2', productId: 'prod-mt-7', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt7-3', productId: 'prod-mt-7', inventoryItemId: 'inv-22', quantity: 30 },
  { id: 'r-mt7-4', productId: 'prod-mt-7', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt7-5', productId: 'prod-mt-7', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt7-6', productId: 'prod-mt-7', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt7-7', productId: 'prod-mt-7', inventoryItemId: 'inv-38', quantity: 1 },

  // Caramel Milktea 16oz
  { id: 'r-mt8-1', productId: 'prod-mt-8', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-mt8-2', productId: 'prod-mt-8', inventoryItemId: 'inv-5', quantity: 20 },
  { id: 'r-mt8-3', productId: 'prod-mt-8', inventoryItemId: 'inv-23', quantity: 30 },
  { id: 'r-mt8-4', productId: 'prod-mt-8', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-mt8-5', productId: 'prod-mt-8', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-mt8-6', productId: 'prod-mt-8', inventoryItemId: 'inv-9', quantity: 1 },
  { id: 'r-mt8-7', productId: 'prod-mt-8', inventoryItemId: 'inv-38', quantity: 1 },

  // Matcha Latte 16oz
  { id: 'r-ma1-1', productId: 'prod-ma-1', inventoryItemId: 'inv-7', quantity: 25 },
  { id: 'r-ma1-2', productId: 'prod-ma-1', inventoryItemId: 'inv-3', quantity: 150 },
  { id: 'r-ma1-3', productId: 'prod-ma-1', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-ma1-4', productId: 'prod-ma-1', inventoryItemId: 'inv-38', quantity: 1 },

  // Matcha Crème Brulee Latte 16oz
  { id: 'r-ma2-1', productId: 'prod-ma-2', inventoryItemId: 'inv-7', quantity: 25 },
  { id: 'r-ma2-2', productId: 'prod-ma-2', inventoryItemId: 'inv-29', quantity: 10 },
  { id: 'r-ma2-3', productId: 'prod-ma-2', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-ma2-4', productId: 'prod-ma-2', inventoryItemId: 'inv-3', quantity: 150 },
  { id: 'r-ma2-5', productId: 'prod-ma-2', inventoryItemId: 'inv-38', quantity: 1 },

  // Matcha Creamy Coconut Latte 16oz
  { id: 'r-ma3-1', productId: 'prod-ma-3', inventoryItemId: 'inv-7', quantity: 25 },
  { id: 'r-ma3-2', productId: 'prod-ma-3', inventoryItemId: 'inv-30', quantity: 10 },
  { id: 'r-ma3-3', productId: 'prod-ma-3', inventoryItemId: 'inv-3', quantity: 150 },
  { id: 'r-ma3-4', productId: 'prod-ma-3', inventoryItemId: 'inv-11', quantity: 15 },
  { id: 'r-ma3-5', productId: 'prod-ma-3', inventoryItemId: 'inv-38', quantity: 1 },

  // Matcha Strawberry Latte 16oz
  { id: 'r-ma4-1', productId: 'prod-ma-4', inventoryItemId: 'inv-7', quantity: 25 },
  { id: 'r-ma4-2', productId: 'prod-ma-4', inventoryItemId: 'inv-15', quantity: 20 },
  { id: 'r-ma4-3', productId: 'prod-ma-4', inventoryItemId: 'inv-3', quantity: 150 },
  { id: 'r-ma4-4', productId: 'prod-ma-4', inventoryItemId: 'inv-38', quantity: 1 },

  // Matcha Frappe 16oz
  { id: 'r-ma5-1', productId: 'prod-ma-5', inventoryItemId: 'inv-7', quantity: 25 },
  { id: 'r-ma5-2', productId: 'prod-ma-5', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-ma5-3', productId: 'prod-ma-5', inventoryItemId: 'inv-10', quantity: 25 },
  { id: 'r-ma5-4', productId: 'prod-ma-5', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-ma5-5', productId: 'prod-ma-5', inventoryItemId: 'inv-40', quantity: 1 },

  // Matcha Strawberry Frappe 16oz
  { id: 'r-ma6-1', productId: 'prod-ma-6', inventoryItemId: 'inv-7', quantity: 20 },
  { id: 'r-ma6-2', productId: 'prod-ma-6', inventoryItemId: 'inv-15', quantity: 20 },
  { id: 'r-ma6-3', productId: 'prod-ma-6', inventoryItemId: 'inv-10', quantity: 25 },
  { id: 'r-ma6-4', productId: 'prod-ma-6', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-ma6-5', productId: 'prod-ma-6', inventoryItemId: 'inv-40', quantity: 1 },

  // Iced Salted Caramel Coffee 16oz
  { id: 'r-cf1-1', productId: 'prod-cf-1', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf1-2', productId: 'prod-cf-1', inventoryItemId: 'inv-24', quantity: 20 },
  { id: 'r-cf1-3', productId: 'prod-cf-1', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf1-4', productId: 'prod-cf-1', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Butterscotch Coffee 16oz
  { id: 'r-cf2-1', productId: 'prod-cf-2', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf2-2', productId: 'prod-cf-2', inventoryItemId: 'inv-25', quantity: 20 },
  { id: 'r-cf2-3', productId: 'prod-cf-2', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf2-4', productId: 'prod-cf-2', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced White Chocolate Coffee 16oz
  { id: 'r-cf3-1', productId: 'prod-cf-3', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf3-2', productId: 'prod-cf-3', inventoryItemId: 'inv-26', quantity: 20 },
  { id: 'r-cf3-3', productId: 'prod-cf-3', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf3-4', productId: 'prod-cf-3', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced French Vanilla Coffee 16oz
  { id: 'r-cf4-1', productId: 'prod-cf-4', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf4-2', productId: 'prod-cf-4', inventoryItemId: 'inv-27', quantity: 20 },
  { id: 'r-cf4-3', productId: 'prod-cf-4', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf4-4', productId: 'prod-cf-4', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Hazelnut Coffee 16oz
  { id: 'r-cf5-1', productId: 'prod-cf-5', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf5-2', productId: 'prod-cf-5', inventoryItemId: 'inv-28', quantity: 20 },
  { id: 'r-cf5-3', productId: 'prod-cf-5', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf5-4', productId: 'prod-cf-5', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Caramel Coffee 16oz
  { id: 'r-cf6-1', productId: 'prod-cf-6', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf6-2', productId: 'prod-cf-6', inventoryItemId: 'inv-23', quantity: 20 },
  { id: 'r-cf6-3', productId: 'prod-cf-6', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf6-4', productId: 'prod-cf-6', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Chocolate Coffee 16oz
  { id: 'r-cf7-1', productId: 'prod-cf-7', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf7-2', productId: 'prod-cf-7', inventoryItemId: 'inv-22', quantity: 20 },
  { id: 'r-cf7-3', productId: 'prod-cf-7', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf7-4', productId: 'prod-cf-7', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Spanish Latte 16oz
  { id: 'r-cf8-1', productId: 'prod-cf-8', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-cf8-2', productId: 'prod-cf-8', inventoryItemId: 'inv-4', quantity: 30 },
  { id: 'r-cf8-3', productId: 'prod-cf-8', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-cf8-4', productId: 'prod-cf-8', inventoryItemId: 'inv-38', quantity: 1 },

  // Iced Americano 16oz
  { id: 'r-cf9-1', productId: 'prod-cf-9', inventoryItemId: 'inv-26', quantity: 5 },
  { id: 'r-cf9-2', productId: 'prod-cf-9', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'r-cf9-3', productId: 'prod-cf-9', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'r-cf9-4', productId: 'prod-cf-9', inventoryItemId: 'inv-38', quantity: 1 },

  // Hot Spanish Latte 12oz
  { id: 'r-hc1-1', productId: 'prod-hc-1', inventoryItemId: 'inv-5', quantity: 30 },
  { id: 'r-hc1-2', productId: 'prod-hc-1', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-hc1-3', productId: 'prod-hc-1', inventoryItemId: 'inv-4', quantity: 15 },
  { id: 'r-hc1-4', productId: 'prod-hc-1', inventoryItemId: 'inv-41', quantity: 1 },

  // Hot Café Mocha 12oz
  { id: 'r-hc2-1', productId: 'prod-hc-2', inventoryItemId: 'inv-5', quantity: 30 },
  { id: 'r-hc2-2', productId: 'prod-hc-2', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-hc2-3', productId: 'prod-hc-2', inventoryItemId: 'inv-22', quantity: 15 },
  { id: 'r-hc2-4', productId: 'prod-hc-2', inventoryItemId: 'inv-41', quantity: 1 },

  // Hot Caramel Macchiato 12oz
  { id: 'r-hc3-1', productId: 'prod-hc-3', inventoryItemId: 'inv-5', quantity: 30 },
  { id: 'r-hc3-2', productId: 'prod-hc-3', inventoryItemId: 'inv-2', quantity: 15 },
  { id: 'r-hc3-3', productId: 'prod-hc-3', inventoryItemId: 'inv-23', quantity: 15 },
  { id: 'r-hc3-4', productId: 'prod-hc-3', inventoryItemId: 'inv-41', quantity: 1 },

  // Hot Americano 12oz
  { id: 'r-hc4-1', productId: 'prod-hc-4', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'r-hc4-2', productId: 'prod-hc-4', inventoryItemId: 'inv-6', quantity: 10 },
  { id: 'r-hc4-3', productId: 'prod-hc-4', inventoryItemId: 'inv-41', quantity: 1 },

  // Fruit Teas 16oz
  { id: 'r-ft1-1', productId: 'prod-ft-1', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-ft1-2', productId: 'prod-ft-1', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-ft1-3', productId: 'prod-ft-1', inventoryItemId: 'inv-34', quantity: 30 },
  { id: 'r-ft1-4', productId: 'prod-ft-1', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-ft1-5', productId: 'prod-ft-1', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ft2-1', productId: 'prod-ft-2', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-ft2-2', productId: 'prod-ft-2', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-ft2-3', productId: 'prod-ft-2', inventoryItemId: 'inv-31', quantity: 30 },
  { id: 'r-ft2-4', productId: 'prod-ft-2', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-ft2-5', productId: 'prod-ft-2', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ft3-1', productId: 'prod-ft-3', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-ft3-2', productId: 'prod-ft-3', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-ft3-3', productId: 'prod-ft-3', inventoryItemId: 'inv-35', quantity: 30 },
  { id: 'r-ft3-4', productId: 'prod-ft-3', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-ft3-5', productId: 'prod-ft-3', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ft4-1', productId: 'prod-ft-4', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-ft4-2', productId: 'prod-ft-4', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-ft4-3', productId: 'prod-ft-4', inventoryItemId: 'inv-37', quantity: 30 },
  { id: 'r-ft4-4', productId: 'prod-ft-4', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-ft4-5', productId: 'prod-ft-4', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ft5-1', productId: 'prod-ft-5', inventoryItemId: 'inv-1', quantity: 150 },
  { id: 'r-ft5-2', productId: 'prod-ft-5', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-ft5-3', productId: 'prod-ft-5', inventoryItemId: 'inv-15', quantity: 30 },
  { id: 'r-ft5-4', productId: 'prod-ft-5', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-ft5-5', productId: 'prod-ft-5', inventoryItemId: 'inv-38', quantity: 1 },

  // Frappes 16oz
  { id: 'r-fr1-1', productId: 'prod-fr-1', inventoryItemId: 'inv-22', quantity: 30 },
  { id: 'r-fr1-2', productId: 'prod-fr-1', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'r-fr1-3', productId: 'prod-fr-1', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-fr1-4', productId: 'prod-fr-1', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'r-fr2-1', productId: 'prod-fr-2', inventoryItemId: 'inv-19', quantity: 30 },
  { id: 'r-fr2-2', productId: 'prod-fr-2', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'r-fr2-3', productId: 'prod-fr-2', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-fr2-4', productId: 'prod-fr-2', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'r-fr3-1', productId: 'prod-fr-3', inventoryItemId: 'inv-23', quantity: 30 },
  { id: 'r-fr3-2', productId: 'prod-fr-3', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'r-fr3-3', productId: 'prod-fr-3', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-fr3-4', productId: 'prod-fr-3', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'r-fr4-1', productId: 'prod-fr-4', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'r-fr4-2', productId: 'prod-fr-4', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'r-fr4-3', productId: 'prod-fr-4', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-fr4-4', productId: 'prod-fr-4', inventoryItemId: 'inv-40', quantity: 1 },

  // Sodas 16oz
  { id: 'r-sd1-1', productId: 'prod-sd-1', inventoryItemId: 'inv-15', quantity: 30 },
  { id: 'r-sd1-2', productId: 'prod-sd-1', inventoryItemId: 'inv-37', quantity: 10 },
  { id: 'r-sd1-3', productId: 'prod-sd-1', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd1-4', productId: 'prod-sd-1', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd1-5', productId: 'prod-sd-1', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd1-6', productId: 'prod-sd-1', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-sd2-1', productId: 'prod-sd-2', inventoryItemId: 'inv-31', quantity: 30 },
  { id: 'r-sd2-2', productId: 'prod-sd-2', inventoryItemId: 'inv-34', quantity: 10 },
  { id: 'r-sd2-3', productId: 'prod-sd-2', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd2-4', productId: 'prod-sd-2', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd2-5', productId: 'prod-sd-2', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd2-6', productId: 'prod-sd-2', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-sd3-1', productId: 'prod-sd-3', inventoryItemId: 'inv-32', quantity: 30 },
  { id: 'r-sd3-2', productId: 'prod-sd-3', inventoryItemId: 'inv-33', quantity: 10 },
  { id: 'r-sd3-3', productId: 'prod-sd-3', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd3-4', productId: 'prod-sd-3', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd3-5', productId: 'prod-sd-3', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd3-6', productId: 'prod-sd-3', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-sd4-1', productId: 'prod-sd-4', inventoryItemId: 'inv-33', quantity: 30 },
  { id: 'r-sd4-2', productId: 'prod-sd-4', inventoryItemId: 'inv-37', quantity: 10 },
  { id: 'r-sd4-3', productId: 'prod-sd-4', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd4-4', productId: 'prod-sd-4', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd4-5', productId: 'prod-sd-4', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd4-6', productId: 'prod-sd-4', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-sd5-1', productId: 'prod-sd-5', inventoryItemId: 'inv-34', quantity: 30 },
  { id: 'r-sd5-2', productId: 'prod-sd-5', inventoryItemId: 'inv-15', quantity: 10 },
  { id: 'r-sd5-3', productId: 'prod-sd-5', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd5-4', productId: 'prod-sd-5', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd5-5', productId: 'prod-sd-5', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd5-6', productId: 'prod-sd-5', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-sd6-1', productId: 'prod-sd-6', inventoryItemId: 'inv-35', quantity: 30 },
  { id: 'r-sd6-2', productId: 'prod-sd-6', inventoryItemId: 'inv-36', quantity: 10 },
  { id: 'r-sd6-3', productId: 'prod-sd-6', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'r-sd6-4', productId: 'prod-sd-6', inventoryItemId: 'inv-12', quantity: 2 },
  { id: 'r-sd6-5', productId: 'prod-sd-6', inventoryItemId: 'inv-14', quantity: 155 },
  { id: 'r-sd6-6', productId: 'prod-sd-6', inventoryItemId: 'inv-38', quantity: 1 },

  // Ube Series 16oz
  { id: 'r-ub1-1', productId: 'prod-ub-1', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-ub1-2', productId: 'prod-ub-1', inventoryItemId: 'inv-16', quantity: 26 },
  { id: 'r-ub1-3', productId: 'prod-ub-1', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'r-ub1-4', productId: 'prod-ub-1', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ub2-1', productId: 'prod-ub-2', inventoryItemId: 'inv-16', quantity: 36 },
  { id: 'r-ub2-2', productId: 'prod-ub-2', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'r-ub2-3', productId: 'prod-ub-2', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'r-ub2-4', productId: 'prod-ub-2', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'r-ub3-1', productId: 'prod-ub-3', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-ub3-2', productId: 'prod-ub-3', inventoryItemId: 'inv-16', quantity: 20 },
  { id: 'r-ub3-3', productId: 'prod-ub-3', inventoryItemId: 'inv-29', quantity: 10 },
  { id: 'r-ub3-4', productId: 'prod-ub-3', inventoryItemId: 'inv-8', quantity: 15 },
  { id: 'r-ub3-5', productId: 'prod-ub-3', inventoryItemId: 'inv-38', quantity: 1 },

  { id: 'r-ub4-1', productId: 'prod-ub-4', inventoryItemId: 'inv-3', quantity: 160 },
  { id: 'r-ub4-2', productId: 'prod-ub-4', inventoryItemId: 'inv-16', quantity: 20 },
  { id: 'r-ub4-3', productId: 'prod-ub-4', inventoryItemId: 'inv-30', quantity: 10 },
  { id: 'r-ub4-4', productId: 'prod-ub-4', inventoryItemId: 'inv-38', quantity: 1 },
];

export const commonbrewProductUpsizeRecipes: ProductRecipeRecord[] = [
  // Wintermelon Milktea 22oz
  { id: 'ur-mt1-1', productId: 'prod-mt-1', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt1-2', productId: 'prod-mt-1', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt1-3', productId: 'prod-mt-1', inventoryItemId: 'inv-17', quantity: 25 },
  { id: 'ur-mt1-4', productId: 'prod-mt-1', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt1-5', productId: 'prod-mt-1', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt1-6', productId: 'prod-mt-1', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt1-7', productId: 'prod-mt-1', inventoryItemId: 'inv-39', quantity: 1 },

  // Brown Sugar Milktea 22oz
  { id: 'ur-mt2-1', productId: 'prod-mt-2', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt2-2', productId: 'prod-mt-2', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt2-3', productId: 'prod-mt-2', inventoryItemId: 'inv-18', quantity: 25 },
  { id: 'ur-mt2-4', productId: 'prod-mt-2', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt2-5', productId: 'prod-mt-2', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt2-6', productId: 'prod-mt-2', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt2-7', productId: 'prod-mt-2', inventoryItemId: 'inv-39', quantity: 1 },

  // Classic Milktea 22oz
  { id: 'ur-mt3-1', productId: 'prod-mt-3', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt3-2', productId: 'prod-mt-3', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt3-3', productId: 'prod-mt-3', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt3-4', productId: 'prod-mt-3', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt3-5', productId: 'prod-mt-3', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt3-6', productId: 'prod-mt-3', inventoryItemId: 'inv-39', quantity: 1 },

  // Cookies & Cream Milktea 22oz
  { id: 'ur-mt4-1', productId: 'prod-mt-4', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt4-2', productId: 'prod-mt-4', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt4-3', productId: 'prod-mt-4', inventoryItemId: 'inv-19', quantity: 35 },
  { id: 'ur-mt4-4', productId: 'prod-mt-4', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt4-5', productId: 'prod-mt-4', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt4-6', productId: 'prod-mt-4', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt4-7', productId: 'prod-mt-4', inventoryItemId: 'inv-39', quantity: 1 },

  // Black Charcoal Milktea 22oz
  { id: 'ur-mt5-1', productId: 'prod-mt-5', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt5-2', productId: 'prod-mt-5', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt5-3', productId: 'prod-mt-5', inventoryItemId: 'inv-20', quantity: 35 },
  { id: 'ur-mt5-4', productId: 'prod-mt-5', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt5-5', productId: 'prod-mt-5', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt5-6', productId: 'prod-mt-5', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt5-7', productId: 'prod-mt-5', inventoryItemId: 'inv-39', quantity: 1 },

  // Thai Milktea 22oz
  { id: 'ur-mt6-1', productId: 'prod-mt-6', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt6-2', productId: 'prod-mt-6', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt6-3', productId: 'prod-mt-6', inventoryItemId: 'inv-21', quantity: 35 },
  { id: 'ur-mt6-4', productId: 'prod-mt-6', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt6-5', productId: 'prod-mt-6', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt6-6', productId: 'prod-mt-6', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt6-7', productId: 'prod-mt-6', inventoryItemId: 'inv-39', quantity: 1 },

  // Chocolate Milktea 22oz
  { id: 'ur-mt7-1', productId: 'prod-mt-7', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt7-2', productId: 'prod-mt-7', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt7-3', productId: 'prod-mt-7', inventoryItemId: 'inv-22', quantity: 35 },
  { id: 'ur-mt7-4', productId: 'prod-mt-7', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt7-5', productId: 'prod-mt-7', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt7-6', productId: 'prod-mt-7', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt7-7', productId: 'prod-mt-7', inventoryItemId: 'inv-39', quantity: 1 },

  // Caramel Milktea 22oz
  { id: 'ur-mt8-1', productId: 'prod-mt-8', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-mt8-2', productId: 'prod-mt-8', inventoryItemId: 'inv-5', quantity: 25 },
  { id: 'ur-mt8-3', productId: 'prod-mt-8', inventoryItemId: 'inv-23', quantity: 35 },
  { id: 'ur-mt8-4', productId: 'prod-mt-8', inventoryItemId: 'inv-6', quantity: 2 },
  { id: 'ur-mt8-5', productId: 'prod-mt-8', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-mt8-6', productId: 'prod-mt-8', inventoryItemId: 'inv-9', quantity: 1.5 },
  { id: 'ur-mt8-7', productId: 'prod-mt-8', inventoryItemId: 'inv-39', quantity: 1 },

  // Matcha Latte 22oz
  { id: 'ur-ma1-1', productId: 'prod-ma-1', inventoryItemId: 'inv-7', quantity: 32 },
  { id: 'ur-ma1-2', productId: 'prod-ma-1', inventoryItemId: 'inv-3', quantity: 200 },
  { id: 'ur-ma1-3', productId: 'prod-ma-1', inventoryItemId: 'inv-6', quantity: 1.5 },
  { id: 'ur-ma1-4', productId: 'prod-ma-1', inventoryItemId: 'inv-39', quantity: 1 },

  // Matcha Crème Brulee Latte 22oz
  { id: 'ur-ma2-1', productId: 'prod-ma-2', inventoryItemId: 'inv-7', quantity: 32 },
  { id: 'ur-ma2-2', productId: 'prod-ma-2', inventoryItemId: 'inv-29', quantity: 15 },
  { id: 'ur-ma2-3', productId: 'prod-ma-2', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-ma2-4', productId: 'prod-ma-2', inventoryItemId: 'inv-3', quantity: 200 },
  { id: 'ur-ma2-5', productId: 'prod-ma-2', inventoryItemId: 'inv-39', quantity: 1 },

  // Matcha Creamy Coconut Latte 22oz
  { id: 'ur-ma3-1', productId: 'prod-ma-3', inventoryItemId: 'inv-7', quantity: 32 },
  { id: 'ur-ma3-2', productId: 'prod-ma-3', inventoryItemId: 'inv-30', quantity: 15 },
  { id: 'ur-ma3-3', productId: 'prod-ma-3', inventoryItemId: 'inv-3', quantity: 200 },
  { id: 'ur-ma3-4', productId: 'prod-ma-3', inventoryItemId: 'inv-11', quantity: 20 },
  { id: 'ur-ma3-5', productId: 'prod-ma-3', inventoryItemId: 'inv-39', quantity: 1 },

  // Matcha Strawberry Latte 22oz
  { id: 'ur-ma4-1', productId: 'prod-ma-4', inventoryItemId: 'inv-7', quantity: 32 },
  { id: 'ur-ma4-2', productId: 'prod-ma-4', inventoryItemId: 'inv-15', quantity: 30 },
  { id: 'ur-ma4-3', productId: 'prod-ma-4', inventoryItemId: 'inv-3', quantity: 200 },
  { id: 'ur-ma4-4', productId: 'prod-ma-4', inventoryItemId: 'inv-39', quantity: 1 },

  // Matcha Frappe 22oz
  { id: 'ur-ma5-1', productId: 'prod-ma-5', inventoryItemId: 'inv-7', quantity: 32 },
  { id: 'ur-ma5-2', productId: 'prod-ma-5', inventoryItemId: 'inv-6', quantity: 1.5 },
  { id: 'ur-ma5-3', productId: 'prod-ma-5', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'ur-ma5-4', productId: 'prod-ma-5', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-ma5-5', productId: 'prod-ma-5', inventoryItemId: 'inv-40', quantity: 1 },

  // Matcha Strawberry Frappe 22oz
  { id: 'ur-ma6-1', productId: 'prod-ma-6', inventoryItemId: 'inv-7', quantity: 27 },
  { id: 'ur-ma6-2', productId: 'prod-ma-6', inventoryItemId: 'inv-15', quantity: 25 },
  { id: 'ur-ma6-3', productId: 'prod-ma-6', inventoryItemId: 'inv-10', quantity: 30 },
  { id: 'ur-ma6-4', productId: 'prod-ma-6', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-ma6-5', productId: 'prod-ma-6', inventoryItemId: 'inv-40', quantity: 1 },

  // Iced Salted Caramel Coffee 22oz
  { id: 'ur-cf1-1', productId: 'prod-cf-1', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf1-2', productId: 'prod-cf-1', inventoryItemId: 'inv-24', quantity: 25 },
  { id: 'ur-cf1-3', productId: 'prod-cf-1', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf1-4', productId: 'prod-cf-1', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Butterscotch Coffee 22oz
  { id: 'ur-cf2-1', productId: 'prod-cf-2', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf2-2', productId: 'prod-cf-2', inventoryItemId: 'inv-25', quantity: 25 },
  { id: 'ur-cf2-3', productId: 'prod-cf-2', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf2-4', productId: 'prod-cf-2', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced White Chocolate Coffee 22oz
  { id: 'ur-cf3-1', productId: 'prod-cf-3', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf3-2', productId: 'prod-cf-3', inventoryItemId: 'inv-26', quantity: 25 },
  { id: 'ur-cf3-3', productId: 'prod-cf-3', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf3-4', productId: 'prod-cf-3', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced French Vanilla Coffee 22oz
  { id: 'ur-cf4-1', productId: 'prod-cf-4', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf4-2', productId: 'prod-cf-4', inventoryItemId: 'inv-27', quantity: 25 },
  { id: 'ur-cf4-3', productId: 'prod-cf-4', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf4-4', productId: 'prod-cf-4', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Hazelnut Coffee 22oz
  { id: 'ur-cf5-1', productId: 'prod-cf-5', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf5-2', productId: 'prod-cf-5', inventoryItemId: 'inv-28', quantity: 25 },
  { id: 'ur-cf5-3', productId: 'prod-cf-5', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf5-4', productId: 'prod-cf-5', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Caramel Coffee 22oz
  { id: 'ur-cf6-1', productId: 'prod-cf-6', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf6-2', productId: 'prod-cf-6', inventoryItemId: 'inv-23', quantity: 25 },
  { id: 'ur-cf6-3', productId: 'prod-cf-6', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf6-4', productId: 'prod-cf-6', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Chocolate Coffee 22oz
  { id: 'ur-cf7-1', productId: 'prod-cf-7', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf7-2', productId: 'prod-cf-7', inventoryItemId: 'inv-22', quantity: 25 },
  { id: 'ur-cf7-3', productId: 'prod-cf-7', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf7-4', productId: 'prod-cf-7', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Spanish Latte 22oz
  { id: 'ur-cf8-1', productId: 'prod-cf-8', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-cf8-2', productId: 'prod-cf-8', inventoryItemId: 'inv-4', quantity: 40 },
  { id: 'ur-cf8-3', productId: 'prod-cf-8', inventoryItemId: 'inv-2', quantity: 18 },
  { id: 'ur-cf8-4', productId: 'prod-cf-8', inventoryItemId: 'inv-39', quantity: 1 },

  // Iced Americano 22oz
  { id: 'ur-cf9-1', productId: 'prod-cf-9', inventoryItemId: 'inv-26', quantity: 10 },
  { id: 'ur-cf9-2', productId: 'prod-cf-9', inventoryItemId: 'inv-2', quantity: 23 },
  { id: 'ur-cf9-3', productId: 'prod-cf-9', inventoryItemId: 'inv-6', quantity: 2.5 },
  { id: 'ur-cf9-4', productId: 'prod-cf-9', inventoryItemId: 'inv-39', quantity: 1 },

  // Fruit Teas 22oz
  { id: 'ur-ft1-1', productId: 'prod-ft-1', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-ft1-2', productId: 'prod-ft-1', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'ur-ft1-3', productId: 'prod-ft-1', inventoryItemId: 'inv-34', quantity: 40 },
  { id: 'ur-ft1-4', productId: 'prod-ft-1', inventoryItemId: 'inv-12', quantity: 3 },
  { id: 'ur-ft1-5', productId: 'prod-ft-1', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ft2-1', productId: 'prod-ft-2', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-ft2-2', productId: 'prod-ft-2', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'ur-ft2-3', productId: 'prod-ft-2', inventoryItemId: 'inv-31', quantity: 40 },
  { id: 'ur-ft2-4', productId: 'prod-ft-2', inventoryItemId: 'inv-12', quantity: 3 },
  { id: 'ur-ft2-5', productId: 'prod-ft-2', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ft3-1', productId: 'prod-ft-3', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-ft3-2', productId: 'prod-ft-3', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'ur-ft3-3', productId: 'prod-ft-3', inventoryItemId: 'inv-35', quantity: 40 },
  { id: 'ur-ft3-4', productId: 'prod-ft-3', inventoryItemId: 'inv-12', quantity: 3 },
  { id: 'ur-ft3-5', productId: 'prod-ft-3', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ft4-1', productId: 'prod-ft-4', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-ft4-2', productId: 'prod-ft-4', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'ur-ft4-3', productId: 'prod-ft-4', inventoryItemId: 'inv-37', quantity: 40 },
  { id: 'ur-ft4-4', productId: 'prod-ft-4', inventoryItemId: 'inv-12', quantity: 3 },
  { id: 'ur-ft4-5', productId: 'prod-ft-4', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ft5-1', productId: 'prod-ft-5', inventoryItemId: 'inv-1', quantity: 200 },
  { id: 'ur-ft5-2', productId: 'prod-ft-5', inventoryItemId: 'inv-13', quantity: 1 },
  { id: 'ur-ft5-3', productId: 'prod-ft-5', inventoryItemId: 'inv-15', quantity: 40 },
  { id: 'ur-ft5-4', productId: 'prod-ft-5', inventoryItemId: 'inv-12', quantity: 3 },
  { id: 'ur-ft5-5', productId: 'prod-ft-5', inventoryItemId: 'inv-39', quantity: 1 },

  // Frappes 22oz
  { id: 'ur-fr1-1', productId: 'prod-fr-1', inventoryItemId: 'inv-22', quantity: 40 },
  { id: 'ur-fr1-2', productId: 'prod-fr-1', inventoryItemId: 'inv-10', quantity: 35 },
  { id: 'ur-fr1-3', productId: 'prod-fr-1', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-fr1-4', productId: 'prod-fr-1', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'ur-fr2-1', productId: 'prod-fr-2', inventoryItemId: 'inv-19', quantity: 40 },
  { id: 'ur-fr2-2', productId: 'prod-fr-2', inventoryItemId: 'inv-10', quantity: 35 },
  { id: 'ur-fr2-3', productId: 'prod-fr-2', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-fr2-4', productId: 'prod-fr-2', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'ur-fr3-1', productId: 'prod-fr-3', inventoryItemId: 'inv-23', quantity: 40 },
  { id: 'ur-fr3-2', productId: 'prod-fr-3', inventoryItemId: 'inv-10', quantity: 35 },
  { id: 'ur-fr3-3', productId: 'prod-fr-3', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-fr3-4', productId: 'prod-fr-3', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'ur-fr4-1', productId: 'prod-fr-4', inventoryItemId: 'inv-2', quantity: 30 },
  { id: 'ur-fr4-2', productId: 'prod-fr-4', inventoryItemId: 'inv-10', quantity: 35 },
  { id: 'ur-fr4-3', productId: 'prod-fr-4', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-fr4-4', productId: 'prod-fr-4', inventoryItemId: 'inv-40', quantity: 1 },

  // Ube Series 22oz
  { id: 'ur-ub1-1', productId: 'prod-ub-1', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-ub1-2', productId: 'prod-ub-1', inventoryItemId: 'inv-16', quantity: 36 },
  { id: 'ur-ub1-3', productId: 'prod-ub-1', inventoryItemId: 'inv-6', quantity: 1 },
  { id: 'ur-ub1-4', productId: 'prod-ub-1', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ub2-1', productId: 'prod-ub-2', inventoryItemId: 'inv-16', quantity: 46 },
  { id: 'ur-ub2-2', productId: 'prod-ub-2', inventoryItemId: 'inv-10', quantity: 35 },
  { id: 'ur-ub2-3', productId: 'prod-ub-2', inventoryItemId: 'inv-11', quantity: 25 },
  { id: 'ur-ub2-4', productId: 'prod-ub-2', inventoryItemId: 'inv-40', quantity: 1 },

  { id: 'ur-ub3-1', productId: 'prod-ub-3', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-ub3-2', productId: 'prod-ub-3', inventoryItemId: 'inv-16', quantity: 30 },
  { id: 'ur-ub3-3', productId: 'prod-ub-3', inventoryItemId: 'inv-29', quantity: 15 },
  { id: 'ur-ub3-4', productId: 'prod-ub-3', inventoryItemId: 'inv-8', quantity: 20 },
  { id: 'ur-ub3-5', productId: 'prod-ub-3', inventoryItemId: 'inv-39', quantity: 1 },

  { id: 'ur-ub4-1', productId: 'prod-ub-4', inventoryItemId: 'inv-3', quantity: 210 },
  { id: 'ur-ub4-2', productId: 'prod-ub-4', inventoryItemId: 'inv-16', quantity: 30 },
  { id: 'ur-ub4-3', productId: 'prod-ub-4', inventoryItemId: 'inv-30', quantity: 15 },
  { id: 'ur-ub4-4', productId: 'prod-ub-4', inventoryItemId: 'inv-39', quantity: 1 },

  // Hot Coffee Series 16oz (Upsize)
  { id: 'ur-hc1-cup', productId: 'prod-hc-1', inventoryItemId: 'inv-56', quantity: 1 },
  { id: 'ur-hc1-cream', productId: 'prod-hc-1', inventoryItemId: 'inv-5', quantity: 40 },
  { id: 'ur-hc1-esp', productId: 'prod-hc-1', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'ur-hc1-cond', productId: 'prod-hc-1', inventoryItemId: 'inv-4', quantity: 20 },

  { id: 'ur-hc2-cup', productId: 'prod-hc-2', inventoryItemId: 'inv-56', quantity: 1 },
  { id: 'ur-hc2-cream', productId: 'prod-hc-2', inventoryItemId: 'inv-5', quantity: 40 },
  { id: 'ur-hc2-esp', productId: 'prod-hc-2', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'ur-hc2-choc', productId: 'prod-hc-2', inventoryItemId: 'inv-22', quantity: 20 },

  { id: 'ur-hc3-cup', productId: 'prod-hc-3', inventoryItemId: 'inv-56', quantity: 1 },
  { id: 'ur-hc3-cream', productId: 'prod-hc-3', inventoryItemId: 'inv-5', quantity: 40 },
  { id: 'ur-hc3-esp', productId: 'prod-hc-3', inventoryItemId: 'inv-2', quantity: 20 },
  { id: 'ur-hc3-car', productId: 'prod-hc-3', inventoryItemId: 'inv-23', quantity: 20 },

  { id: 'ur-hc4-cup', productId: 'prod-hc-4', inventoryItemId: 'inv-56', quantity: 1 },
  { id: 'ur-hc4-esp', productId: 'prod-hc-4', inventoryItemId: 'inv-2', quantity: 25 },
  { id: 'ur-hc4-sug', productId: 'prod-hc-4', inventoryItemId: 'inv-6', quantity: 12 },

  // Snacks Recipes
  { id: 'r-snk1-1', productId: 'prod-snk-1', inventoryItemId: 'inv-42', quantity: 1 },
  { id: 'r-snk2-1', productId: 'prod-snk-2', inventoryItemId: 'inv-43', quantity: 1 },
  { id: 'r-snk2-2', productId: 'prod-snk-2', inventoryItemId: 'inv-44', quantity: 1 },
  { id: 'r-snk3-1', productId: 'prod-snk-3', inventoryItemId: 'inv-43', quantity: 1 },
  { id: 'r-snk4-1', productId: 'prod-snk-4', inventoryItemId: 'inv-45', quantity: 150 },
  { id: 'r-snk4-2', productId: 'prod-snk-4', inventoryItemId: 'inv-46', quantity: 15 },
  { id: 'r-snk5-1', productId: 'prod-snk-5', inventoryItemId: 'inv-45', quantity: 150 },
  { id: 'r-snk5-2', productId: 'prod-snk-5', inventoryItemId: 'inv-47', quantity: 15 },
  { id: 'r-snk6-1', productId: 'prod-snk-6', inventoryItemId: 'inv-45', quantity: 150 },
  { id: 'r-snk6-2', productId: 'prod-snk-6', inventoryItemId: 'inv-48', quantity: 15 },

  // Pastries Recipes
  { id: 'r-pst1-1', productId: 'prod-pst-1', inventoryItemId: 'inv-49', quantity: 1 },
  { id: 'r-pst2-1', productId: 'prod-pst-2', inventoryItemId: 'inv-50', quantity: 1 },
  { id: 'r-pst3-1', productId: 'prod-pst-3', inventoryItemId: 'inv-51', quantity: 1 },
  { id: 'r-pst4-1', productId: 'prod-pst-4', inventoryItemId: 'inv-52', quantity: 1 },
  { id: 'r-pst5-1', productId: 'prod-pst-5', inventoryItemId: 'inv-53', quantity: 1 },
];
