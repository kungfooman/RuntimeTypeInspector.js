# Loading the RTI engine on the stock examples page

`bash supported/three/build.sh` overwrites the upstream build artifacts in
place: `tmp/supported/three.js/build/three.{core,module,tsl,webgpu,webgpu.nodes}.js`
(plus `three.cjs`) hold the instrumented engine under the exact filenames the
examples import (`"three": "../build/three.module.js"`). The stock pages at
`tmp/supported/three.js/examples/*.html` need zero changes: the runtime is
inlined playcanvas-style, so every output is one simple bundle with no bare
specifiers for the browser to resolve.

How it works:

- The RTI bundle instruments the same sources the old `three.rti.js` entry
  gated (`src/Three.js`, `src/Three.WebGPU.js`, `src/Three.TSL.js`,
  `src/Three.WebGPU.Nodes.js`), plus the project-local shims
  (`three-enums.js`, `customTypes.TypedArray`).
- The `export * from '@runtime-type-inspector/runtime'` line the early
  sandbox entries carried is gone: like
  `~/playcanvas-engine/src/index.rti.js`, the entries import only what they
  need (`setOptions`, `customTypes`). That also killed the 900+ "Conflicting
  re-exports" warnings where runtime helper names shadowed engine exports.
- RTI reports through `crossContextPostMessage` (`parent || self`), so
  warnings from inside the example iframe reach the parent page. Open the
  TypePanel there (or read `postMessage` traffic) to see live findings.
