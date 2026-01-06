/**
 * 🔤 Levenshtein Distance Algorithm
 * Fuzzy string matching için
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of edits (insertions, deletions, substitutions)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create 2D array
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return dp[len1][len2];
}

/**
 * Calculate similarity ratio (0-1) between two strings
 */
export function similarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  
  if (maxLen === 0) return 1.0;
  
  return 1 - (distance / maxLen);
}

/**
 * Find best match from a list of candidates
 */
export function findBestMatch(
  target: string, 
  candidates: string[]
): { match: string; score: number; index: number } | null {
  if (!candidates.length) return null;
  
  let bestMatch = candidates[0];
  let bestScore = similarity(target.toLowerCase(), candidates[0].toLowerCase());
  let bestIndex = 0;
  
  for (let i = 1; i < candidates.length; i++) {
    const score = similarity(target.toLowerCase(), candidates[i].toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidates[i];
      bestIndex = i;
    }
  }
  
  return { match: bestMatch, score: bestScore, index: bestIndex };
}

