export function randomIndex(count: number, random = Math.random): number {
  if (!Number.isInteger(count) || count < 1)
    throw new RangeError("At least one artwork is required");
  return Math.floor(random() * count);
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
