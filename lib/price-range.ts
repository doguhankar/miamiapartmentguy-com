export type PriceRange = {
  min: number | null;
  max: number | null;
};

function parseAmount(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? input : null;
  if (typeof input !== 'string' || !input.trim()) return null;
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function getPriceRange(minInput: unknown, maxInput?: unknown): PriceRange {
  if (minInput && typeof minInput === 'object' && !Array.isArray(minInput)) {
    const value = minInput as { min?: unknown; max?: unknown };
    return { min: parseAmount(value.min), max: parseAmount(value.max) };
  }

  if (typeof minInput === 'string' && minInput.includes('-') && maxInput === undefined) {
    const [min, max] = minInput.split('-', 2);
    return { min: parseAmount(min), max: parseAmount(max) };
  }

  return { min: parseAmount(minInput), max: parseAmount(maxInput) };
}
