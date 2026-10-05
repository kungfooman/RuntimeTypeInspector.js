import {readFileSync} from 'fs';
import {RTI_INFO} from './version.js';
/**
 * Commit/subject are stamped by `node sync-version.js` during
 * `npm run build:publish`, `null` from unstamped source.
 * @returns {boolean} True when the shape is valid.
 */
function validInfo() {
  if (!RTI_INFO || typeof RTI_INFO !== 'object') {
    return false;
  }
  const field = (_) => _ === null || typeof _ === 'string';
  return typeof RTI_INFO.version === 'string' &&
    field(RTI_INFO.commit) && field(RTI_INFO.subject);
}
const tests = [
  // `sync-version.js` mirrors package.json into version.js — never hand-edit.
  () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version === RTI_INFO.version,
  () => validInfo(),
];
export {tests};
