/**
 * Copies text to the clipboard: the async Clipboard API when available, a
 * sync textarea plus `execCommand('copy')` fallback otherwise. Page-level
 * `copy`-event blockers (like the examples viewer) cannot stop either path:
 * the API bypasses copy events and the fallback dispatches our own node.
 * @param {string} text - The text to copy.
 * @returns {boolean|Promise<boolean>} True on success (a promise only when the async Clipboard API handled it).
 * @example copyText('hello') // true, or Promise<true> with the Clipboard API
 */
export function copyText(text) {
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
  if (clipboard && typeof clipboard.writeText === 'function') {
    return clipboard.writeText(String(text)).then(() => true, () => false);
  }
  try {
    const area = document.createElement('textarea');
    area.value = String(text);
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select?.();
    const ok = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
    area.remove();
    return ok === true;
  } catch {
    return false;
  }
}
