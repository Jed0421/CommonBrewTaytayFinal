import type { InventoryItem } from '../types';

export function inventoryStatus(item: InventoryItem, today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)) {
  if (item.expirationDate && item.expirationDate <= today) return 'expired';
  if (item.currentStock <= 0) return 'out';
  return item.isLowStock ? 'low' : 'good';
}

export function countInventoryWarnings(items: InventoryItem[]) {
  const counts = { low: 0, expired: 0, out: 0, total: 0 };
  const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  for (const item of items) {
    const status = inventoryStatus(item, today);
    if (status !== 'good') {
      counts[status]++;
      counts.total++;
    }
  }
  return counts;
}
