import {mergedClassShape} from './classShape.js';
import {instantiateReference} from './instantiateReference.js';
import {registerClass, classes, bumpClassVersion} from './registerClass.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {validateType} from './validateType.js';
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
  class MergeBase {
    base() {}
  }
  class MergeChild extends MergeBase {
    sub() {}
  }
  classes.MergeBase = MergeBase;
  classes.MergeChild = MergeChild;
  bumpClassVersion();
  try {
    const first = mergedClassShape('MergeChild');
    const second = mergedClassShape('MergeChild');
    return first === second && Object.isFrozen(first) && 'base' in first.properties && 'sub' in first.properties;
  } finally {
    dropClass('MergeBase');
    dropClass('MergeChild');
  }
}
function testMergedShapeReflectsTypedefChange() {
  // Re-registering the harvested typedef recomputes instead of serving the
  // stale merge, so class edits show up without restarting.
  class HarvestedBox {}
  registerClass(HarvestedBox);
  try {
    registerTypedef('HarvestedBox', {type: 'object', properties: {a: 'number'}});
    const before = mergedClassShape('HarvestedBox');
    registerTypedef('HarvestedBox', {type: 'object', properties: {a: 'number', b: 'string'}});
    const after = mergedClassShape('HarvestedBox');
    return before !== after && !('b' in before.properties) && 'b' in after.properties;
  } finally {
    dropClass('HarvestedBox');
    dropTypedef('HarvestedBox');
  }
}
function testReferenceSharesIdentityPerArgs() {
  // One generic instantiation per reference plus arguments: repeats share,
  // distinct arguments stay distinct, so 260 `addComponent('element', …)`
  // calls resolve the options tower once.
  const prev = typedefs.ArgumentsBox;
  try {
    registerTypedef('ArgumentsBox', {type: 'object', properties: {value: 'T'}}, ['T']);
    const first = instantiateReference({type: 'reference', name: 'ArgumentsBox', args: ['"a"']}, noop);
    const second = instantiateReference({type: 'reference', name: 'ArgumentsBox', args: ['"a"']}, noop);
    const other = instantiateReference({type: 'reference', name: 'ArgumentsBox', args: ['"b"']}, noop);
    return first === second && Object.isFrozen(first) && first !== other && first.properties.value === '"a"' && other.properties.value === '"b"';
  } finally {
    if (prev === undefined) {
      delete typedefs.ArgumentsBox;
    } else {
      typedefs.ArgumentsBox = prev;
    }
    bumpTypedefVersion();
  }
}
function testReferenceReflectsReregistration() {
  // Re-registering the generic typedef recomputes pending instantiations
  // instead of serving the stale substitution.
  const prev = typedefs.ReregisteredBox;
  try {
    registerTypedef('ReregisteredBox', {type: 'object', properties: {v: 'T'}}, ['T']);
    const before = instantiateReference({type: 'reference', name: 'ReregisteredBox', args: ['"a"']}, noop);
    registerTypedef('ReregisteredBox', {type: 'object', properties: {v: 'T', w: 'number'}}, ['T']);
    const after = instantiateReference({type: 'reference', name: 'ReregisteredBox', args: ['"a"']}, noop);
    return before !== after && !('w' in before.properties) && 'w' in after.properties;
  } finally {
    if (prev === undefined) {
      delete typedefs.ReregisteredBox;
    } else {
      typedefs.ReregisteredBox = prev;
    }
    bumpTypedefVersion();
  }
}
function testRepeatValidationStaysCorrect() {
  // Sharing the resolved shape must not leak verdicts: good, bad, then good
  // again for one name decides per value, and the other name is unaffected.
  class TowerComponent {
    toggle() {}
  }
  class TowerCamera extends TowerComponent {
    constructor() {
      super();
      this.fov = 1;
    }
  }
  registerClass(TowerComponent);
  registerClass(TowerCamera);
  const prevCam = typedefs.TowerCamera;
  const prevMap = typedefs.TowerMap;
  const prevName = typedefs.TowerName;
  const prevOpts = typedefs.TowerOptions;
  try {
    registerTypedef('TowerCamera', {type: 'object', properties: {fov: 'number'}});
    registerTypedef('TowerEntity', {type: 'object', properties: {camera: 'TowerCamera', name: 'string'}});
    registerTypedef('TowerMap', expandType('{ [K in keyof TowerEntity as NonNullable<TowerEntity[K]> extends TowerComponent ? K : never]: NonNullable<TowerEntity[K]> }'));
    registerTypedef('TowerName', expandType('keyof TowerMap & string'));
    registerTypedef('TowerOptions', expandType('Partial<Pick<TowerMap[K], "fov">>'), ['K']);
    const check = (type, data) => {
      const templates = {K: 'TowerName'};
      if (!inspectTypeWithTemplates(type, 'K', 'TowerEntity#add', 'type', templates)) {
        return false;
      }
      return inspectTypeWithTemplates(data, {type: 'reference', name: 'TowerOptions', args: ['K']}, 'TowerEntity#add', 'data', templates);
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
    for (const key of ['TowerCamera', 'TowerEntity', 'TowerMap', 'TowerName', 'TowerOptions']) {
      delete typedefs[key];
    }
    bumpTypedefVersion();
    dropClass('TowerComponent');
    dropClass('TowerCamera');
    substitutedCache.clear();
    if (prevCam !== undefined) {
      typedefs.TowerCamera = prevCam;
    }
    if (prevMap !== undefined) {
      typedefs.TowerMap = prevMap;
    }
    if (prevName !== undefined) {
      typedefs.TowerName = prevName;
    }
    if (prevOpts !== undefined) {
      typedefs.TowerOptions = prevOpts;
    }
  }
}
function testReferenceKeepsNegZeroDistinct() {
  // Cache keys must not collapse JSON-identical siblings: `-0` and `+0`
  // instantiate distinctly, mirroring how inference pins them distinctly.
  const prev = typedefs.NegativeZeroBox;
  try {
    registerTypedef('NegativeZeroBox', {type: 'object', properties: {v: 'T'}}, ['T']);
    const neg = instantiateReference({type: 'reference', name: 'NegativeZeroBox', args: [-0]}, noop);
    const pos = instantiateReference({type: 'reference', name: 'NegativeZeroBox', args: [0]}, noop);
    return neg !== pos && Object.is(neg.properties.v, -0) && Object.is(pos.properties.v, 0) && !Object.is(pos.properties.v, -0);
  } finally {
    if (prev === undefined) {
      delete typedefs.NegativeZeroBox;
    } else {
      typedefs.NegativeZeroBox = prev;
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
  class ThroughputComponent {
    toggle() {}
  }
  class ThroughputElement extends ThroughputComponent {}
  registerClass(ThroughputComponent);
  registerClass(ThroughputElement);
  try {
    const props = {};
    for (let i = 0; i < 50; i++) {
      props[`p${i}`] = 'number';
    }
    registerTypedef('ThroughputElement', {type: 'object', properties: props});
    registerTypedef('ThroughputEntity', {type: 'object', properties: {element: 'ThroughputElement', name: 'string'}});
    registerTypedef('ThroughputMap', expandType('{ [K in keyof ThroughputEntity as NonNullable<ThroughputEntity[K]> extends ThroughputComponent ? K : never]: NonNullable<ThroughputEntity[K]> }'));
    registerTypedef('ThroughputName', expandType('keyof ThroughputMap & string'));
    registerTypedef('ThroughputWritable', expandType('{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]'), ['T']);
    registerTypedef('ThroughputOptionKeys', expandType('{ [K in ThroughputWritable<C>]: K extends \'system\' | \'entity\' ? never : NonNullable<C[K]> extends Function ? never : K }[ThroughputWritable<C>]'), ['C']);
    registerTypedef('ThroughputOptionsOf', expandType('Partial<Pick<C, Extract<ThroughputOptionKeys<C>, keyof C>>>'), ['C']);
    registerTypedef('ThroughputMerged', expandType('ThroughputOptionsOf<ThroughputMap[K]>'), ['K']);
    registerTypedef('ThroughputOptions', expandType('{ [P in keyof ThroughputMerged<K>]: ThroughputMerged<K>[P] }'), ['K']);
    const check = (type, data) => {
      const templates = {K: 'ThroughputName'};
      if (!inspectTypeWithTemplates(type, 'K', 'Throughput#add', 'type', templates)) {
        return false;
      }
      return inspectTypeWithTemplates(data, {type: 'reference', name: 'ThroughputOptions', args: ['K']}, 'Throughput#add', 'data', templates);
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
    for (const key of ['ThroughputElement', 'ThroughputEntity', 'ThroughputMap', 'ThroughputName', 'ThroughputWritable', 'ThroughputOptionKeys', 'ThroughputOptionsOf', 'ThroughputMerged', 'ThroughputOptions']) {
      delete typedefs[key];
    }
    bumpTypedefVersion();
    dropClass('ThroughputComponent');
    dropClass('ThroughputElement');
    substitutedCache.clear();
  }
}
function testFrozenSharedTupleMaterializes() {
  // A generic instantiation shares a registry tuple and freezes it:
  // materializing a mapping over that tuple must leave the frozen node
  // alone instead of throwing, desugaring into a fresh flattened copy, and
  // validation still accepts and rejects the same values because tuple
  // validation expands rest elements itself.
  registerTypedef('SharedTupleBox', {
    type: 'object',
    properties: {
      t: {type: 'tuple', elements: [
        {type: 'rest', annotation: {type: 'tuple', elements: ['number']}},
        'string',
      ]},
    },
  }, ['X']);
  try {
    const inst = instantiateReference({type: 'reference', name: 'SharedTupleBox', args: ['any']}, noop);
    const shared = inst.properties.t;
    const freshNode = () => ({
      type: 'mapping',
      iterable: {type: 'keyof', argument: {type: 'object', properties: {a: 'number', b: 'number'}}},
      element: 'K',
      result: shared,
    });
    let mat;
    try {
      mat = createTypeFromMapping(freshNode(), noop);
    } catch {
      return false;
    }
    const untouched = shared.elements[0].type === 'rest';
    const flat = mat.properties.a;
    const desugared = flat !== shared && flat.elements.length === 2 && flat.elements[0] === 'number' && flat.elements[1] === 'string';
    const ok = validateType({a: [1, 'x'], b: [2, 'y']}, mat, 'loc', 'name', true, noop, 0);
    const bad = validateType({a: [1, 2, 'x']}, mat, 'loc', 'name', true, noop, 0) === false;
    return untouched && desugared && ok && bad;
  } finally {
    dropTypedef('SharedTupleBox');
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
  testFrozenSharedTupleMaterializes,
];
