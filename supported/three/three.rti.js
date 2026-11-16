export * from '../../tmp/supported/three.js/src/Three.js';
import { setOptions, TypePanel } from '@runtime-type-inspector/runtime';
import { customTypes } from '@runtime-type-inspector/runtime';
import './three-enums.js';
setOptions({
    windowedChecks: true,
    mapCheckWindowMinTotalMs: 20
});
// TypedArray has no global constructor (abstract %TypedArray%), so the bare
// `{TypedArray}` references across math/ (Interpolant, MathUtils,
// BufferAttribute, ...) never resolve: every typed array warns `unchecked`.
// One custom type covers them all until a shared validator lands upstream.
customTypes.TypedArray = (value) => ArrayBuffer.isView(value);
// Like ~/playcanvas-engine/src/index.rti.js: start the UI in the entry, so
// every example page shows the panel with zero per-page wiring. Browser-only:
// the same bundle also loads in node smoke tests, where `document` exists
// but has no body to append to, so guard on a real body.
export const typePanel = typeof document !== 'undefined' && document.body ? new TypePanel() : null;
