import { supabase } from './supabase.ts';

interface ReceiptOrder {
  id: string;
  status: string;
  gcashReceiptImage?: string;
  gcashReceiptPending?: boolean;
}

function staging() {
  if (!supabase) throw new Error('Supabase receipt storage is unavailable.');
  return supabase.storage.from('gcash-receipts-pending');
}

export async function stageReceipt(id: string, image: string) {
  const { error } = await staging().upload(id, new Blob([image], { type: 'text/plain' }), { upsert: false });
  if (error) throw error;
}

export async function readPendingReceipt(id: string) {
  const { data, error } = await staging().download(id);
  if (error) throw error;
  return data.text();
}

export async function discardPendingReceipt(id: string) {
  const { error } = await staging().remove([id]);
  if (error) throw error;
}

export async function withReceiptPreviews<T extends ReceiptOrder>(orders: T[]): Promise<T[]> {
  return Promise.all(orders.map(async order => {
    if (order.status === 'Cancelled') return { ...order, gcashReceiptImage: undefined };
    if (!order.gcashReceiptPending || order.gcashReceiptImage) return order;
    try {
      return { ...order, gcashReceiptImage: await readPendingReceipt(order.id) };
    } catch (error) {
      console.error('[GCash receipt preview]', error);
      return order;
    }
  }));
}
