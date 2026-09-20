import { Customer, Decision, Order, RefundRecord } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API error (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/api/customers`, { cache: 'no-store' });
  return handleResponse<Customer[]>(res);
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/customers/${customerId}/orders`, { cache: 'no-store' });
  return handleResponse<Order[]>(res);
}

export async function submitRefund(data: {
  customerId: string;
  orderNumber?: string;
  rawMessage: string;
  isPartialClaim?: boolean;
}): Promise<RefundRecord> {
  const res = await fetch(`${API_BASE}/api/refunds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<RefundRecord>(res);
}

export async function listRefunds(options?: {
  decision?: Decision;
  page?: number;
  limit?: number;
}): Promise<{ items: RefundRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (options?.decision) params.append('decision', options.decision);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const res = await fetch(`${API_BASE}/api/refunds?${params.toString()}`, { cache: 'no-store' });
  return handleResponse(res);
}

export async function getRefundById(id: string): Promise<RefundRecord> {
  const res = await fetch(`${API_BASE}/api/refunds/${id}`, { cache: 'no-store' });
  return handleResponse<RefundRecord>(res);
}

export async function overrideRefund(
  id: string,
  data: { decision: 'APPROVED' | 'DENIED'; overrideReason: string; operatorName?: string },
): Promise<RefundRecord> {
  const res = await fetch(`${API_BASE}/api/refunds/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<RefundRecord>(res);
}
