import {docReaderDepFree} from '../jsdoc-parsing-depfree/docReaderDepFree.js';
import {docReaderTS} from './docReaderTS.js';
import {canonicalDocEqual} from '../jsdoc-parsing-depfree/canonicalDocCompare.js';
import {canonicalDocCovers} from '../jsdoc-parsing-depfree/canonicalDocCompare.js';
/**
 * Injectable doc-reader probe: runs over one bare comment at transpile
 * time. The pipeline ignores the return value; warn inside when the case
 * is worth keeping (`docReaderBoth` warns on DRIFT only).
 * @typedef {(comment: string) => unknown} DocReader
 */
/**
 * Injectable doc-reader probe: runs over one bare comment at transpile
 * time. The pipeline ignores the return value; warn inside when the case
 * is worth keeping (`docReaderBoth` warns on DRIFT only).
 * @typedef {(comment: string) => unknown} DocReader
 */
/**
 * Runs both readers over one comment at transpile time and warns on real
 * drift: the depfree document is the enforcement input, the TS document
 * is the observe-only oracle. SAME and COVERED stay silent by design,
 * so a clean codebase prints nothing; every warn is a case worth keeping.
 * A throwing oracle degrades to a warn and never fails the transpile.
 * @example
 * docReaderBoth('@param {number} x');
 * // 'SAME'
 * @param {string} comment - JSDoc tag text without comment delimiters.
 * @returns {'SAME'|'COVERED'|'DRIFT'} The reader verdict for the comment.
 */
function docReaderBoth(comment) {
  const depfree = docReaderDepFree(comment);
  let fromTs;
  try {
    fromTs = docReaderTS(comment);
  } catch (error) {
    // Defensive: the TS reader is total on every probed input (garbage,
    // unbalanced braces, huge comments all lower without throwing), so no
    // spec reaches this branch. It stays because a future TS internal
    // throw must degrade to a warn, never fail the transpile.
    console.warn('docReaderBoth> TS reader threw, depfree still enforces.', {comment, error});
    return 'DRIFT';
  }
  if (canonicalDocEqual(depfree, fromTs)) {
    return 'SAME';
  }
  if (canonicalDocCovers(depfree, fromTs)) {
    return 'COVERED';
  }
  console.warn('docReaderBoth> readers drift on comment.', {comment, depfree, fromTs});
  return 'DRIFT';
}
export {docReaderBoth};
