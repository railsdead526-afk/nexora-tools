export const PRO_PRICE = 49_000;
export const PRO_DURATION_DAYS = 30;
export const PRO_PAYMENT_PROVIDER = 'manual_bank' as const;

export function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
