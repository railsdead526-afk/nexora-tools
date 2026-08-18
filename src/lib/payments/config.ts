export const PRO_PRICE = 49_000;
export const PRO_DURATION_DAYS = 30;

export function getDanaPaymentConfig() {
  const accountName = process.env.DANA_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.DANA_ACCOUNT_NUMBER?.trim();

  if (!accountName || !accountNumber) {
    throw new Error(
      'Konfigurasi pembayaran DANA belum tersedia.',
    );
  }

  return {
    accountName,
    accountNumber,
  };
}
