/**
 * Convert seconds (video playback time) to mm:ss display format.
 * Input should be in seconds; use for lesson notes timestamps.
 */
export function formatTimestamp(seconds: number): string {
  const secs = Number(seconds);
  if (!Number.isFinite(secs) || secs < 0) return "00:00";
  const totalSeconds = Math.floor(secs);
  const mins = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
