// Adjust these values after testing on physical phones.
export const TILT_RANGE = 25;
export const TILT_DEAD_ZONE = 1.5;
export const TILT_TIMEOUT = 1500;

export function tiltAngle(
  beta: number | null,
  gamma: number | null,
  rotation: number,
) {
  const angle = ((rotation % 360) + 360) % 360;
  const value =
    angle === 90
      ? beta === null
        ? null
        : -beta
      : angle === 270
        ? beta
        : gamma === null
          ? null
          : gamma * (angle === 180 ? -1 : 1);
  return value !== null && Number.isFinite(value) ? value : null;
}

export function tiltTarget(
  value: number,
  baseline: number,
  range = TILT_RANGE,
) {
  const delta = ((value - baseline + 540) % 360) - 180;
  const distance = Math.max(0, Math.abs(delta) - TILT_DEAD_ZONE);
  return (
    500 +
    Math.sign(delta) * Math.min(1, distance / (range - TILT_DEAD_ZONE)) * 500
  );
}
