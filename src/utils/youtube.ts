export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return 'kY31FpT-hOU'; // fallback high-quality trading video
  
  const trimmed = urlOrId.trim();
  
  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Regex for standard youtube patterns
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  
  return match && match[1] ? match[1] : 'kY31FpT-hOU';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
