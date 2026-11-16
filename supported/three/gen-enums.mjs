import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const constantsPath = join(repoRoot, 'tmp', 'supported', 'three.js', 'src', 'constants.js');
// Collect `export const NAME = <literal>;` from three.js constants.js so the
// RTI entry can register each as a typedef (value-as-type JSDoc unions like
// (WebGLCoordinateSystem|WebGPUCoordinateSystem) resolve through the typedef
// path, same recipe as the playcanvas ACTION_*/BODYTYPE_* shims).
// Object-valued constants (MOUSE, TOUCH, ...) are skipped: only literals
// narrow through the reference validator.
const src = readFileSync(constantsPath, 'utf8');
const re = /export const ([A-Za-z_$][\w$]*) = (("[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|null));/g;
const out = [];
let m;
for (; (m = re.exec(src)) !== null;) {
  out.push(`registerTypedef('${m[1]}', ${m[2]});`);
}
const header = `import { registerTypedef } from '@runtime-type-inspector/runtime';
`;
writeFileSync(join(here, 'three-enums.js'), header + out.join('\n') + '\n');
console.log('wrote three-enums.js with ' + out.length + ' typedefs');
