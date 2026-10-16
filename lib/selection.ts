/** UTC shifted by nine hours gives an unambiguous JST calendar day. */
export function jstDateKey(date = new Date()): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function dailyIndex(count: number, date = new Date()): number {
  if (!Number.isInteger(count) || count < 1)
    throw new RangeError("At least one artwork is required");
  let hash = 2166136261;
  for (const char of jstDateKey(date))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % count;
}

export function shuffleIndex(
  count: number,
  current: number,
  random = Math.random,
): number {
  if (!Number.isInteger(count) || count < 1)
    throw new RangeError("At least one artwork is required");
  if (count === 1) return 0;
  return (current + 1 + Math.floor(random() * (count - 1))) % count;
}
