import { createProPaymentOrder } from '@/lib/payments/create-pro-payment';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return createProPaymentOrder(request);
}
