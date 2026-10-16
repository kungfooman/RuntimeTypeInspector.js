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
export const tests = [
  testMergedShapeSharesIdentity,
  testMergedShapeReflectsTypedefChange,
  testReferenceSharesIdentityPerArgs,
  testReferenceReflectsReregistration,
  testReferenceKeepsNegZeroDistinct,
  testRepeatValidationStaysCorrect,
];
