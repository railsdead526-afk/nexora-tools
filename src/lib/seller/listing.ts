export interface ListingFormValues {
  productName: string;
  category: string;
  material: string;
  size: string;
  packageContents: string;
  benefits: string;
  warranty: string;
}

function clean(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function buildListingText(values: ListingFormValues) {
  const productName = clean(values.productName) || 'Nama Produk';
  const category = clean(values.category);
  const material = clean(values.material);
  const size = clean(values.size);
  const packageContents = clean(values.packageContents);
  const rawBenefits = values.benefits;
  const warranty = clean(values.warranty);

  const title = [productName, category].filter(Boolean).join(' - ');
  const details = [
    category && `Kategori: ${category}`,
    material && `Bahan: ${material}`,
    size && `Ukuran/varian: ${size}`,
    packageContents && `Isi paket: ${packageContents}`,
    warranty && `Garansi: ${warranty}`,
  ].filter(Boolean);

  const benefitLines = rawBenefits
    ? rawBenefits
        .split(/[\n,;]+/)
        .map((item) => clean(item))
        .filter(Boolean)
        .map((item) => `• ${item}`)
    : [];

  const description = [
    `${productName}`,
    '',
    'Keunggulan:',
    ...(benefitLines.length ? benefitLines : ['• Tulis keunggulan utama produk di sini.']),
    '',
    'Detail produk:',
    ...(details.length ? details.map((item) => `• ${item}`) : ['• Lengkapi spesifikasi produk sebelum dipublikasikan.']),
    '',
    'Catatan:',
    'Pastikan foto, ukuran, warna, stok, dan spesifikasi sesuai dengan produk yang diterima pembeli.',
  ].join('\n');

  return { title, description };
}

export function getSafeFilename(value: string) {
  return (clean(value) || 'produk')
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'produk';
}
