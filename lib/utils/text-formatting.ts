/**
 * Formats Czech menu item names by bolding the main dish name before prepositions
 * Common Czech prepositions: s (with), na (on), v (in), se (with), po (after), etc.
 */
export function formatMenuItemName(name: string): { bold: string; rest: string } {
  const words = name.split(' ');
  
  // Look at first 4 words for short prepositions (1-2 letters)
  let boldEndIndex = -1;
  
  for (let i = 0; i < Math.min(4, words.length); i++) {
    const word = words[i];
    // Check if word is 1 or 2 letters (likely a preposition)
    if (word.length <= 2) {
      boldEndIndex = i;
      break;
    }
  }
  
  // If no short word found in first 4 words, default to first 2 words
  if (boldEndIndex === -1) {
    boldEndIndex = Math.min(2, words.length);
  }
  
  // Split the name into bold and regular parts
  const boldPart = words.slice(0, boldEndIndex).join(' ');
  const restPart = words.slice(boldEndIndex).join(' ');
  
  return {
    bold: boldPart,
    rest: restPart
  };
}