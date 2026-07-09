export function toCents(euros: number): number {
  return Math.round(euros * 100);
}

export function toEuros(cents: number): number {
  return cents / 100;
}

export function formatEuros(cents: number, locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(toEuros(cents));
}

export function formatNumber(value: number, locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateTotalExclTax(
  quantity: number,
  unitPrice: number,
  discountPercent?: number,
  discountAmount?: number
): number {
  let total = quantity * unitPrice;
  if (discountPercent) {
    total -= Math.round(total * (discountPercent / 10000));
  }
  if (discountAmount) {
    total -= discountAmount;
  }
  return Math.max(0, total);
}

export function calculateVatAmount(totalExclTax: number, vatRate: number): number {
  return Math.round(totalExclTax * (vatRate / 10000));
}
