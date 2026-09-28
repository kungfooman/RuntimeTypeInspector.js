import {readFileSync} from 'fs';
import {RTI_VERSION, RTI_BUILD} from './version.js';
const tests = [
  // The source fallback must mirror package.json (bundles inject it).
  () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version === RTI_VERSION,
  // From source there is no bundle stamp.
  () => RTI_BUILD === null,
];
export {tests};
