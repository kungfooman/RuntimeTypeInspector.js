/**
 * Human-readable byte count for hover previews and log labels: exact bytes
 * below one kibibyte, one decimal kilobytes/megabytes above. Never throws;
 * hostile input reads as `0 B` instead of breaking the caller.
 * @param {*} bytes - The byte count.
 * @returns {string} Text like `384 KB`.
 * @example formatBytes(384 * 1024) // '384.0 KB'
 */
function formatBytes(bytes) {
  try {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n < 0) {
      return '0 B';
    }
    if (n < 1024) {
      return `${Math.floor(n)} B`;
    }
    if (n < 1024 * 1024) {
      return `${(n / 1024).toFixed(1)} KB`;
    }
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return '0 B';
  }
}
export {formatBytes};
