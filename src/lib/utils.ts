/** Format a USD price: 34900 → "$34,900" */
export function formatPrice(price: number): string {
  return '$' + price.toLocaleString('en-US')
}

/**
 * Standard loan monthly payment.
 * @param principal  Car price in USD
 * @param annualRate Annual interest rate (default 9%)
 * @param months     Loan term in months (default 60)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate = 0.09,
  months = 60,
): number {
  const r = annualRate / 12
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1))
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Generate a short 7-char base62 ID */
export function shortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(7)))
    .map((b) => chars[b % 62])
    .join('')
}
