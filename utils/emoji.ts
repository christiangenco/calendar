// Function to extract the first emoji from a string
export function extractFirstEmoji(text: string | undefined): string | null {
  if (!text) return null

  // This regex pattern matches emoji characters
  const emojiRegex = /[\p{Emoji_Presentation}|\p{Emoji}\uFE0F]/u
  const match = text.match(emojiRegex)

  return match ? match[0] : null
}

// Function to check if a string contains numbers
export function containsNumbers(text: string | undefined): boolean {
  if (!text) return false
  return /\d/.test(text)
}
