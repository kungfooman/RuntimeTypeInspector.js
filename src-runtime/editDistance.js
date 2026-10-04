/**
 * Edit distance for "did you mean …?" key suggestions.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} Levenshtein distance.
 * @example
 * editDistance('camera', 'camra'); // 1
 */
function editDistance(a, b) {
  const prev = Array.from({length: b.length + 1}, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = keep;
    }
  }
  return prev[b.length];
}
export {editDistance};
