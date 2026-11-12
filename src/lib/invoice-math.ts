// Invoice totals are computed on read, never stored. Shared by the data layer
// and the invoice form (live totals while editing).

export const round2 = (n: number | string | null | undefined) => Math.round((Number(n) || 0) * 100) / 100;

export function invoiceTotals(
  items: { quantity: number | string; unit_price: number | string }[],
  taxRate: number | string | null = 0,
) {
  const subtotal = round2(
    items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0),
  );
  const tax = round2((subtotal * (Number(taxRate) || 0)) / 100);
  return { subtotal, tax, total: round2(subtotal + tax) };
}
