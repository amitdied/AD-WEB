export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match) return match[1];
  const vParam = trimmed.split('v=')[1]?.split('&')[0];
  if (vParam && vParam.length === 11) return vParam;
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return '';
}
