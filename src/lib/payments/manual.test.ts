import { describe, expect, it } from 'vitest';
import {
  ALLOWED_PROOF_TYPES,
  createManualReference,
  getManualPaymentInstructions,
  hashProof,
  safeProofExtension,
} from '@/lib/payments/manual';
import { consumeRateLimit } from '@/lib/security/rate-limit';

describe('manual payment helpers', () => {
  it('uses manual payment and a 30-day PRO duration', () => {
    expect(getManualPaymentInstructions().provider).toBe('manual_bank');
    expect(getManualPaymentInstructions().durationDays).toBe(30);
  });

  it('accepts only supported proof content types', () => {
    expect(ALLOWED_PROOF_TYPES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_PROOF_TYPES.has('image/png')).toBe(true);
    expect(ALLOWED_PROOF_TYPES.has('application/pdf')).toBe(true);
    expect(ALLOWED_PROOF_TYPES.has('text/html')).toBe(false);
  });

  it('maps supported proof types to safe extensions', () => {
    expect(safeProofExtension('image/jpeg')).toBe('jpg');
    expect(safeProofExtension('image/png')).toBe('png');
    expect(safeProofExtension('application/pdf')).toBe('pdf');
  });

  it('creates a unique manual reference and deterministic proof hash', () => {
    expect(createManualReference()).toMatch(/^manual-[0-9a-f-]{36}$/);
    expect(hashProof(new TextEncoder().encode('proof'))).toBe(
      'c1cda26362828b69266512052b97cb3729e3b052e4ade47c0a1e3383defe73c7',
    );
  });
});

describe('rate limit helper', () => {
  it('blocks a key after the configured burst', () => {
    const key = `test-${Date.now()}`;
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(consumeRateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});
