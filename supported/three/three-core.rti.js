export * from '../../tmp/supported/three.js/src/Three.Core.js';
import { setOptions, TypePanel } from '@runtime-type-inspector/runtime';
import './three-enums.js';
setOptions({
    windowedChecks: true,
    mapCheckWindowMinTotalMs: 20
});
// Browser-only panel startup (see three.rti.js): node smoke tests share this
// entry shape, so guard on a real body.
export const typePanel = typeof document !== 'undefined' && document.body ? new TypePanel() : null;
