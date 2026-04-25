export function formatKamas(n, withSign = false) {
  const a = Math.abs(n);
  const sign = withSign ? (n > 0 ? '+' : n < 0 ? '-' : '') : n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}${(a / 1_000).toFixed(1)}k`;
  return `${sign}${Math.round(a).toLocaleString('fr-FR')}`;
}
