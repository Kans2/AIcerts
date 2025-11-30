export function tokenizeWords(text) {
  if (!text) return [];
  // Normalize: to lower, remove diacritics, treat apostrophes inside words
  const normalized = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  // Extract words: letters, digits, apostrophes allowed inside words
  const tokens = Array.from(normalized.matchAll(/\b[a-z0-9']+\b/g)).map(m => m[0]);
  return tokens;
}

export function diffWords(oldText, newText) {
  const oldTokens = tokenizeWords(oldText);
  const newTokens = tokenizeWords(newText);

  // Use sets for unique-word differences
  const oldSet = new Set(oldTokens);
  const newSet = new Set(newTokens);

  const added = [];
  const removed = [];

  for (const w of newSet) {
    if (!oldSet.has(w)) added.push(w);
  }
  for (const w of oldSet) {
    if (!newSet.has(w)) removed.push(w);
  }

  // Sort alphabetically for deterministic output
  added.sort();
  removed.sort();

  return { addedWords: added, removedWords: removed, oldWordCount: oldTokens.length, newWordCount: newTokens.length };
}
