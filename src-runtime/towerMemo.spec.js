import {mergedClassShape} from './classShape.js';
import {instantiateReference} from './instantiateReference.js';
import {registerClass, classes, bumpClassVersion} from './registerClass.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {substitutedCache} from './substitutedFor.js';
const noop = () => undefined;
function dropClass(name) {
  delete classes[name];
  bumpClassVersion();
}
function dropTypedef(name) {
  delete typedefs[name];
  delete classes[name];
  bumpTypedefVersion();
  bumpClassVersion();
}
function testMergedShapeSharesIdentity() {
  // Repeats for one name share one frozen shape instead of rebuilding the
  // merge per key and per validation, which is what made long accessor
  // lists cost ~0.6 s per check.
  class MemoBase {
    base() {}
  }
  class MemoSub extends MemoBase {
    sub() {}
  }
  classes.MemoBase = MemoBase;
  classes.MemoSub = MemoSub;
  bumpClassVersion();
  try {
    const first = mergedClassShape('MemoSub');
    const second = mergedClassShape('MemoSub');
    return first === second && Object.isFrozen(first) && 'base' in first.properties && 'sub' in first.properties;
  } finally {
    dropClass('MemoBase');
    dropClass('MemoSub');
  }
}
function testMergedShapeReflectsTypedefChange() {
  // Re-registering the harvested typedef recomputes instead of serving the
  // stale merge, so class edits show up without restarting.
  class MemoHarv {}
  registerClass(MemoHarv);
  try {
    registerTypedef('MemoHarv', {type: 'object', properties: {a: 'number'}});
    const before = mergedClassShape('MemoHarv');
    registerTypedef('MemoHarv', {type: 'object', properties: {a: 'number', b: 'string'}});
    const after = mergedClassShape('MemoHarv');
    return before !== after && !('b' in before.properties) && 'b' in after.properties;
  } finally {
    dropClass('MemoHarv');
    dropTypedef('MemoHarv');
  }
}
function testReferenceSharesIdentityPerArgs() {
  // One generic instantiation per reference plus arguments: repeats share,
  // distinct arguments stay distinct, so 260 `addComponent('element', …)`
  // calls resolve the options tower once.
  const prev = typedefs.MemoBox;
  try {
    registerTypedef('MemoBox', {type: 'object', properties: {value: 'T'}}, ['T']);
    const first = instantiateReference({type: 'reference', name: 'MemoBox', args: ['"a"']}, noop);
    const second = instantiateReference({type: 'reference', name: 'MemoBox', args: ['"a"']}, noop);
    const other = instantiateReference({type: 'reference', name: 'MemoBox', args: ['"b"']}, noop);
    return first === second && Object.isFrozen(first) && first !== other && first.properties.value === '"a"' && other.properties.value === '"b"';
  } finally {
    if (prev === undefined) {
      delete typedefs.MemoBox;
    } else {
      typedefs.MemoBox = prev;
    }
    bumpTypedefVersion();
  }
}
function testReferenceReflectsReregistration() {
  // Re-registering the generic typedef recomputes pending instantiations
  // instead of serving the stale substitution.
  const prev = typedefs.MemoRe;
  try {
    registerTypedef('MemoRe', {type: 'object', properties: {v: 'T'}}, ['T']);
    const before = instantiateReference({type: 'reference', name: 'MemoRe', args: ['"a"']}, noop);
    registerTypedef('MemoRe', {type: 'object', properties: {v: 'T', w: 'number'}}, ['T']);
    const after = instantiateReference({type: 'reference', name: 'MemoRe', args: ['"a"']}, noop);
    return before !== after && !('w' in before.properties) && 'w' in after.properties;
  } finally {
    if (prev === undefined) {
      delete typedefs.MemoRe;
    } else {
      typedefs.MemoRe = prev;
    }
    bumpTypedefVersion();
  }
}
function testRepeatValidationStaysCorrect() {
  // Sharing the resolved shape must not leak verdicts: good, bad, then good
  // again for one name decides per value, and the other name is unaffected.
  class MemoComponent {
    toggle() {}
  }
  class MemoCam extends MemoComponent {
    constructor() {
      super();
      this.fov = 1;
    }
  }
  registerClass(MemoComponent);
  registerClass(MemoCam);
  const prevCam = typedefs.MemoCam;
  const prevMap = typedefs.MemoMap;
  const prevName = typedefs.MemoName;
  const prevOpts = typedefs.MemoOpts;
  try {
    registerTypedef('MemoCam', {type: 'object', properties: {fov: 'number'}});
    registerTypedef('MemoEntity', {type: 'object', properties: {camera: 'MemoCam', name: 'string'}});
    registerTypedef('MemoMap', expandType('{ [K in keyof MemoEntity as NonNullable<MemoEntity[K]> extends MemoComponent ? K : never]: NonNullable<MemoEntity[K]> }'));
    registerTypedef('MemoName', expandType('keyof MemoMap & string'));
    registerTypedef('MemoOpts', expandType('Partial<Pick<MemoMap[K], "fov">>'), ['K']);
    const check = (type, data) => {
      const templates = {K: 'MemoName'};
      if (!inspectTypeWithTemplates(type, 'K', 'MemoEntity#add', 'type', templates)) {
        return false;
      }
      return inspectTypeWithTemplates(data, {type: 'reference', name: 'MemoOpts', args: ['K']}, 'MemoEntity#add', 'data', templates);
    };
    const good = {fov: 1};
    const bad = {fov: 'x'};
    if (!check('camera', good)) {
      return false;
    }
    if (!check('camera', good)) {
      return false;
    }
    if (check('camera', bad)) {
      return false;
    }
    if (!check('camera', good)) {
      return false;
    }
    return true;
  } finally {
    for (const key of ['MemoCam', 'MemoEntity', 'MemoMap', 'MemoName', 'MemoOpts']) {
      delete typedefs[key];
    }
    bumpTypedefVersion();
    dropClass('MemoComponent');
    dropClass('MemoCam');
    substitutedCache.clear();
    if (prevCam !== undefined) {
      typedefs.MemoCam = prevCam;
    }
    if (prevMap !== undefined) {
      typedefs.MemoMap = prevMap;
    }
    if (prevName !== undefined) {
      typedefs.MemoName = prevName;
    }
    if (prevOpts !== undefined) {
      typedefs.MemoOpts = prevOpts;
    }
  }
}
function testReferenceKeepsNegZeroDistinct() {
  // Cache keys must not collapse JSON-identical siblings: `-0` and `+0`
  // instantiate distinctly, mirroring how inference pins them distinctly.
  const prev = typedefs.MemoNeg;
  try {
    registerTypedef('MemoNeg', {type: 'object', properties: {v: 'T'}}, ['T']);
    const neg = instantiateReference({type: 'reference', name: 'MemoNeg', args: [-0]}, noop);
    const pos = instantiateReference({type: 'reference', name: 'MemoNeg', args: [0]}, noop);
    return neg !== pos && Object.is(neg.properties.v, -0) && Object.is(pos.properties.v, 0) && !Object.is(pos.properties.v, -0);
  } finally {
    if (prev === undefined) {
      delete typedefs.MemoNeg;
    } else {
      typedefs.MemoNeg = prev;
    }
    bumpTypedefVersion();
  }
}
function testHundredRepeatsCheaperThanOneCold() {
  // Repeats over one component name must cost a fraction of a single cold
  // resolution: the tower resolves once, then 100 repeats share it. The
  // bar is 100x (a 50-key tower measures ~1400x per call, ~13000x at 150
  // keys), which keeps headroom for CI timing noise while failing at ~1x
  // without the memoization. Every repeat still validates its own value.
  class MemoPerfComponent {
    toggle() {}
  }
  class MemoPerfElement extends MemoPerfComponent {}
  registerClass(MemoPerfComponent);
  registerClass(MemoPerfElement);
  try {
    const props = {};
    for (let i = 0; i < 50; i++) {
      props[`p${i}`] = 'number';
    }
    registerTypedef('MemoPerfElement', {type: 'object', properties: props});
    registerTypedef('MemoPerfEntity', {type: 'object', properties: {element: 'MemoPerfElement', name: 'string'}});
    registerTypedef('MemoPerfMap', expandType('{ [K in keyof MemoPerfEntity as NonNullable<MemoPerfEntity[K]> extends MemoPerfComponent ? K : never]: NonNullable<MemoPerfEntity[K]> }'));
    registerTypedef('MemoPerfName', expandType('keyof MemoPerfMap & string'));
    registerTypedef('MemoPerfWritable', expandType('{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]'), ['T']);
    registerTypedef('MemoPerfOptionKeys', expandType('{ [K in MemoPerfWritable<C>]: K extends \'system\' | \'entity\' ? never : NonNullable<C[K]> extends Function ? never : K }[MemoPerfWritable<C>]'), ['C']);
    registerTypedef('MemoPerfOptionsOf', expandType('Partial<Pick<C, Extract<MemoPerfOptionKeys<C>, keyof C>>>'), ['C']);
    registerTypedef('MemoPerfMerged', expandType('MemoPerfOptionsOf<MemoPerfMap[K]>'), ['K']);
    registerTypedef('MemoPerfOptions', expandType('{ [P in keyof MemoPerfMerged<K>]: MemoPerfMerged<K>[P] }'), ['K']);
    const check = (type, data) => {
      const templates = {K: 'MemoPerfName'};
      if (!inspectTypeWithTemplates(type, 'K', 'MemoPerf#add', 'type', templates)) {
        return false;
      }
      return inspectTypeWithTemplates(data, {type: 'reference', name: 'MemoPerfOptions', args: ['K']}, 'MemoPerf#add', 'data', templates);
    };
    const value = {p0: 1};
    const coldStart = performance.now();
    if (!check('element', value)) {
      return false;
    }
    const coldMs = performance.now() - coldStart;
    const repeats = 100;
    const repeatStart = performance.now();
    for (let i = 0; i < repeats; i++) {
      if (!check('element', value)) {
        return false;
      }
    }
    const avgMs = (performance.now() - repeatStart) / repeats;
    if (!(avgMs > 0)) {
      return coldMs > 0;
    }
    return avgMs * 100 < coldMs;
  } finally {
    for (const key of ['MemoPerfElement', 'MemoPerfEntity', 'MemoPerfMap', 'MemoPerfName', 'MemoPerfWritable', 'MemoPerfOptionKeys', 'MemoPerfOptionsOf', 'MemoPerfMerged', 'MemoPerfOptions']) {
      delete typedefs[key];
    }
    bumpTypedefVersion();
    dropClass('MemoPerfComponent');
    dropClass('MemoPerfElement');
    substitutedCache.clear();
  }
}
export const tests = [
  testMergedShapeSharesIdentity,
  testMergedShapeReflectsTypedefChange,
  testReferenceSharesIdentityPerArgs,
  testReferenceReflectsReregistration,
  testReferenceKeepsNegZeroDistinct,
  testRepeatValidationStaysCorrect,
  testHundredRepeatsCheaperThanOneCold,
];
