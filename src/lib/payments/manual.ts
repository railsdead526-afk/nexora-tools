import { createHash, randomUUID } from 'crypto';
import { PRO_DURATION_DAYS, PRO_PAYMENT_PROVIDER, PRO_PRICE } from '@/lib/payments/config';

export const PAYMENT_PROOF_BUCKET = 'payment-proofs';
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export function getManualPaymentInstructions() {
  return {
    provider: PRO_PAYMENT_PROVIDER,
    amount: PRO_PRICE,
    durationDays: PRO_DURATION_DAYS,
    method: process.env.MANUAL_PAYMENT_METHOD?.trim() || 'Transfer bank / e-wallet manual',
    accountName: process.env.MANUAL_PAYMENT_ACCOUNT_NAME?.trim() || 'Nexora Tools',
    accountNumber:
      process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER?.trim() || 'ISI_NOMOR_REKENING_DI_ENV',
    instructions:
      process.env.MANUAL_PAYMENT_INSTRUCTIONS?.trim() ||
      'Transfer sesuai nominal, simpan bukti pembayaran, lalu unggah bukti pada formulir ini.',
  };
}

export function createManualReference() {
  return `manual-${randomUUID()}`;
}

export function safeProofExtension(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  return 'pdf';
}

export function hashProof(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}
