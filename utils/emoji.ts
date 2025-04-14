// Function to extract the first emoji from a string
export function extractFirstEmoji(text: string | undefined): string | null {
  if (!text) return null;

  // First, find all characters that could be emoji
  const emojiRegex =
    /[\p{Emoji_Presentation}|\p{Emoji_Component}|\p{Extended_Pictographic}][\uFE0F\u200D]?/gu;
  const matches = text.match(emojiRegex);

  if (!matches) return null;

  // Filter out any matches that are just numbers
  const nonNumberMatches = matches.filter((match) => !/^\d+$/.test(match));

  // Return the first non-number match, or null if none found
  return nonNumberMatches.length > 0 ? nonNumberMatches[0] : null;
}

// Function to check if a string contains numbers
export function containsNumbers(text: string | undefined): boolean {
  if (!text) return false;
  return /\d/.test(text);
}
