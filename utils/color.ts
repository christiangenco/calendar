export function extractHexColor(text?: string): string | null {
  if (!text) return null;
  // Matches #RRGGBB or #RGB
  const match = text.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/);
  return match ? match[0] : null;
}
