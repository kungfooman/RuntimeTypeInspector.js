// Node smoke test: loads the RTI-instrumented upstream-named bundles from
// the checkout build dir (where build.sh overwrote them), then exercises
// core three.js classes. RTI failure messages are captured instead of
// swallowed, so the tail of the log shows live checking works.
import {join} from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const build = join(here, '..', '..', 'tmp', 'supported', 'three.js', 'build');
const seen = [];
globalThis.self = globalThis;
globalThis.postMessage = (msg) => {
  seen.push(msg);
};
globalThis.addEventListener = () => {};
const three = await import(join(build, 'three.module.js'));
console.log('loaded OK, exports:', Object.keys(three).length);
const v = new three.Vector3(1, 2, 3);
console.log('Vector3:', v.x, v.y, v.z);
const m = new three.Matrix4();
console.log('isMatrix4:', m.isMatrix4 === true);
const bad = new three.Vector3('oops', 2, 3);
console.log('bad Vector3 x:', bad.x);
console.log('RTI messages:', seen.length);
for (const msg of seen.slice(0, 10)) {
  console.log('---', msg.loc, '#', msg.name, '::', (msg.strings || []).join(' | ').slice(0, 300));
}
