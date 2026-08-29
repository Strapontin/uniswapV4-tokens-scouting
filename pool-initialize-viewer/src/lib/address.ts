export function normalizeAddress(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const lower = trimmed.toLowerCase();
  const hex = lower.startsWith("0x") ? lower.slice(2) : lower;

  if (!/^[0-9a-f]+$/.test(hex)) {
    return trimmed;
  }

  const compact = hex.length > 40 ? hex.slice(-40) : hex;
  return `0x${compact}`;
}
