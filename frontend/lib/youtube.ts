/**
 * Extract YouTube video ID from common URL formats.
 * Returns null if not a recognized YouTube URL or ID cannot be extracted.
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|$)/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID or youtube.com/embed/ID or youtube.com/v/ID
  const standardMatch = trimmed.match(
    /(?:youtube\.com\/watch\?.*v=|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
  );
  if (standardMatch) return standardMatch[1];
  return null;
}
