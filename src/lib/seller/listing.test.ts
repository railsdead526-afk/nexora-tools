import { describe, expect, it } from 'vitest';
import { buildListingText, getSafeFilename } from './listing';

describe('seller listing helpers', () => {
  it('builds a structured listing from seller facts', () => {
    const result = buildListingText({
      productName: '  Mukena   Travel  ',
      category: 'Fashion Muslim',
      material: 'Katun rayon',
      size: 'M, L, XL',
      packageContents: '1 mukena + pouch',
      benefits: 'Ringan dibawa\nmudah dicuci',
      warranty: '7 hari',
    });

    expect(result.title).toBe('Mukena Travel - Fashion Muslim');
    expect(result.description).toContain('• Ringan dibawa');
    expect(result.description).toContain('• mudah dicuci');
    expect(result.description).toContain('• Bahan: Katun rayon');
    expect(result.description).toContain('• Garansi: 7 hari');
  });

  it('keeps the output safe when optional fields are empty', () => {
    const result = buildListingText({
      productName: '',
      category: '',
      material: '',
      size: '',
      packageContents: '',
      benefits: '',
      warranty: '',
    });

    expect(result.title).toBe('Nama Produk');
    expect(result.description).toContain('• Tulis keunggulan utama produk di sini.');
    expect(result.description).toContain('• Lengkapi spesifikasi produk sebelum dipublikasikan.');
  });

  it('creates a predictable download filename', () => {
    expect(getSafeFilename('  Baju Muslim / Premium! ')).toBe('baju-muslim-premium');
  });
});
