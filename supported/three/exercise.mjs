import {join} from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const build = join(here, '..', '..', 'tmp', 'supported', 'three.js', 'build');
const seen = [];
globalThis.self = globalThis;
globalThis.postMessage = (msg) => {
  if (!msg.repeat) { seen.push(msg); }
};
globalThis.addEventListener = () => {};
const three = await import(join(build, 'three.module.js'));
seen.length = 0;
// Exercise a broad slice of the math + core API with VALID inputs.
const v = new three.Vector3(1, 2, 3);
v.add(new three.Vector3(4, 5, 6));
v.sub(new three.Vector3(1, 1, 1));
v.clone();
v.copy(new three.Vector3(0, 0, 0));
new three.Vector3().set(1, 2, 3);
new three.Quaternion().setFromAxisAngle(new three.Vector3(0, 1, 0), Math.PI / 4);
new three.Euler(1, 2, 3);
new three.Matrix4().makeRotationX(0.5);
new three.Matrix4().multiplyMatrices(new three.Matrix4(), new three.Matrix4());
new three.Box3(new three.Vector3(0, 0, 0), new three.Vector3(1, 1, 1));
new three.Sphere(new three.Vector3(0, 0, 0), 1);
new three.Plane(new three.Vector3(0, 1, 0), 0);
new three.Ray(new three.Vector3(0, 0, 0), new three.Vector3(0, 0, -1));
new three.Color(1, 0, 0);
new three.Color().setRGB(1, 0, 0);
new three.Color().setHex(0xff0000);
new three.BufferGeometry();
new three.Mesh(new three.BufferGeometry(), new three.MeshBasicMaterial());
console.log('exercise done, fresh messages:', seen.length);
const byLoc = {};
for (const msg of seen) {
  const key = `${msg.loc} # ${msg.name}`;
  byLoc[key] = byLoc[key] || {count: 0, sample: msg};
  byLoc[key].count++;
}
for (const key of Object.keys(byLoc).sort()) {
  const {count, sample} = byLoc[key];
  const strings = sample.strings ? JSON.stringify(sample.strings).slice(0, 220) : '(none)';
  console.log(`${count}x ${key} value=${sample.valueToString} strings=${strings}`);
  console.log('   expect:', JSON.stringify(sample.expect)?.slice(0, 160));
}
