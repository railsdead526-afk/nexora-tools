import { createHash, timingSafeEqual } from 'crypto';

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  transaction_id?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
  settlement_time?: string;
  merchant_id?: string;
}

function getServerKey() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY is not configured.');
  return serverKey;
}

export function isMidtransProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

export function getMidtransMerchantId() {
  return process.env.MIDTRANS_MERCHANT_ID?.trim() || null;
}

export async function createMidtransSnapTransaction(input: {
  orderId: string;
  amount: number;
  email: string;
  finishUrl: string;
  notificationUrl: string;
}) {
  if (!/^[A-Za-z0-9._~-]{1,50}$/.test(input.orderId)) {
    throw new Error('Order ID Midtrans tidak valid.');
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Nominal pembayaran tidak valid.');
  }

  const endpoint = isMidtransProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const auth = Buffer.from(`${getServerKey()}:`).toString('base64');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Override-Notification': input.notificationUrl,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amount,
      },
      item_details: [
        {
          id: 'nexora-pro-monthly',
          price: input.amount,
          quantity: 1,
          name: 'Nexora PRO - 30 Hari',
        },
      ],
      customer_details: {
        email: input.email || undefined,
      },
      callbacks: {
        finish: input.finishUrl,
      },
    }),
    cache: 'no-store',
  });

  const body = await response.json();
  if (!response.ok || !body?.redirect_url || !body?.token) {
    throw new Error(
      body?.error_messages?.join(', ') ||
        body?.message ||
        'Gagal membuat transaksi Midtrans.',
    );
  }

  return {
    token: body.token as string,
    redirectUrl: body.redirect_url as string,
  };
}

export function verifyMidtransSignature(payload: MidtransNotification) {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${getServerKey()}`;
  const expected = createHash('sha512').update(raw).digest('hex');
  const received = payload.signature_key || '';

  if (!/^[a-f0-9]{128}$/i.test(received)) return false;
  if (expected.length !== received.length) return false;

  return timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(received, 'utf8'),
  );
}

export function mapMidtransStatus(payload: MidtransNotification) {
  const status = payload.transaction_status?.toLowerCase();
  const fraudStatus = payload.fraud_status?.toLowerCase();
  const isFraudAccepted = !fraudStatus || fraudStatus === 'accept';

  if (
    payload.status_code === '200' &&
    isFraudAccepted &&
    (status === 'settlement' || status === 'capture')
  ) {
    return 'paid' as const;
  }

  if (status === 'expire') return 'expired' as const;
  if (status === 'cancel') return 'cancelled' as const;
  if (status === 'deny' || status === 'failure') return 'failed' as const;
  if (status === 'refund' || status === 'partial_refund') return 'refunded' as const;

  return 'pending' as const;
}
