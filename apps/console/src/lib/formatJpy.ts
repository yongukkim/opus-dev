export function formatJpy(amount: number): string {
  return new Intl.NumberFormat("ja-JP").format(amount);
}
