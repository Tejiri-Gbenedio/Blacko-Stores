export function formatNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  return "₦" + naira.toLocaleString("en-NG");
}
