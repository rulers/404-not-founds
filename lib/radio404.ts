export const MIN_FREQUENCY = 388;
export const MAX_FREQUENCY = 420;
export type RadioPhase = "search" | "near" | "receiving" | "lost";
export function clampFrequency(value: number) {
  return Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, value));
}
export function dragFrequency(value: number, delta: number, elapsed: number) {
  const speed = Math.abs(delta) / Math.max(8, elapsed);
  const sensitivity = 0.025 + 0.095 * Math.min(1, speed / 0.8);
  return clampFrequency(value + delta * sensitivity);
}
export function signalStrength(frequency: number) {
  return Math.max(0, 1 - Math.abs(frequency - 404) / 2);
}
export type RadioState = {
  frequency: number;
  phase: RadioPhase;
  enteredAt: number | null;
};
export function tuneRadio(
  state: RadioState,
  frequency: number,
  now: number,
): RadioState {
  const value = clampFrequency(frequency);
  const distance = Math.abs(value - 404);
  if (state.enteredAt !== null && distance <= 0.65) {
    const elapsed = now - state.enteredAt;
    return {
      frequency: value,
      enteredAt: state.enteredAt,
      phase: elapsed >= 2400 ? "lost" : elapsed >= 600 ? "receiving" : "near",
    };
  }
  return {
    frequency: value,
    enteredAt: distance <= 0.4 ? now : null,
    phase: distance < 2 ? "near" : "search",
  };
}
