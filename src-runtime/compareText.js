import {formatCompare} from './formatCompare.js';
import {explainMismatch} from './explainMismatch.js';
/**
 * Renders a warning as plain text for the comparator Copy button: message,
 * diagnosis findings, the missing-keys stub, then the Expected/Actual panes.
 * @param {object} warnObj - The warning row (`msg`, `expect`, `value`, `name`, `hits`).
 * @returns {string} The copyable comparison text.
 * @example compareText({msg: 'bad', expect: 'number', value: 's', name: 'x', hits: 1})
 */
export function compareText(warnObj) {
  const lines = [warnObj.msg || ''];
  let diagnosis;
  try {
    diagnosis = explainMismatch(warnObj.value, warnObj.expect, warnObj.name);
  } catch {
    diagnosis = {findings: [], stub: ''};
  }
  lines.push('Diagnosis:');
  if (diagnosis.findings.length) {
    for (const finding of diagnosis.findings) {
      lines.push(`- [${finding.kind}] ${finding.path}: ${finding.detail || ''} (expected ${finding.expected}, got ${finding.actual})`);
    }
  } else {
    lines.push('- The value now passes (or the shape is opaque to the differ).');
  }
  if (diagnosis.stub) {
    lines.push('To make it work, add the missing keys:');
    lines.push(diagnosis.stub);
  }
  let expectPretty = String(warnObj.expect ?? '');
  let actualPretty = String(warnObj.value ?? '');
  try {
    ({expectPretty, actualPretty} = formatCompare(warnObj.expect, warnObj.value));
  } catch {
    // Fallbacks above already hold the raw shapes.
  }
  lines.push('Expected:');
  lines.push(expectPretty);
  lines.push('Actual:');
  lines.push(actualPretty);
  lines.push(`Hits: ${warnObj.hits ?? 1}`);
  return lines.join('\n');
}
