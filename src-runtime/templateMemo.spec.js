import {inspectTypeWithTemplates, substitutedCache} from './inspectTypeWithTemplates.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {mergedClassShape} from './classShape.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass, classes} from './registerClass.js';
import {expandType} from '../src-transpiler/expandType.js';
function testMemoStableAcrossRepeats() {
  // Same site plus same bindings share one substituted tree: the second
  // identical call adds no cache entry and decides identically.
  substitutedCache.clear();
  try {
    const templates = () => ({T: 'string'});
    const first = inspectTypeWithTemplates('a', 'T', 'memoSite', 'v', templates());
    const sizeAfterFirst = substitutedCache.size;
    const second = inspectTypeWithTemplates('b', 'T', 'memoSite', 'v', templates());
    return first === true && second === true && sizeAfterFirst >= 1 &&
      substitutedCache.size === sizeAfterFirst;
  } finally {
    substitutedCache.clear();
  }
}
function testBindingsDistinguishEntries() {
  // Pre-pinned literals are inputs, not just inference state: different
  // bindings at one site must not share a substituted tree.
  substitutedCache.clear();
  try {
    const expect = expandType('K extends "a" | "b" ? K : never');
    const a = inspectTypeWithTemplates('a', expect, 'memoPins', 'v', {K: '"a"'});
    const sizeAfterA = substitutedCache.size;
    const b = inspectTypeWithTemplates('b', expect, 'memoPins', 'v', {K: '"b"'});
    const c = inspectTypeWithTemplates('c', expect, 'memoPins', 'v', {K: '"a"'});
    return a === true && b === true && c === false && substitutedCache.size === sizeAfterA + 1;
  } finally {
    substitutedCache.clear();
  }
}
function testMappingReflectsReregistration() {
  // Mapping instantiation consults live registries: re-registering a
  // typedef between identical calls on the same node recomputes (version
  // guard) instead of serving the stale shape.
  const prev = typedefs.Box;
  try {
    registerTypedef('Box', {type: 'object', properties: {w: 'number'}});
    const node = expandType('{ [K in keyof Box]-?: Box[K] }');
    const before = JSON.stringify(createTypeFromMapping(node, () => {}));
    registerTypedef('Box', {type: 'object', properties: {w: 'number', h: 'number'}});
    const after = JSON.stringify(createTypeFromMapping(node, () => {}));
    return before.includes('"w"') && !before.includes('"h"') && after.includes('"h"');
  } finally {
    if (prev === undefined) {
      delete typedefs.Box;
    } else {
      typedefs.Box = prev;
    }
  }
}
function testClassShapeReflectsReregistration() {
  // Same for classes: rebinding a name to another constructor re-derives
  // instead of serving the stale shape.
  const A1 = class Alpha {
    a() {}
  };
  const A2 = class Alpha {
    b() {}
  };
  const prev = classes.Alpha;
  try {
    registerClass(A1);
    const before = Object.keys(mergedClassShape('Alpha').properties);
    registerClass(A2);
    const after = Object.keys(mergedClassShape('Alpha').properties);
    return before.includes('a') && !before.includes('b') && after.includes('b') && !after.includes('a');
  } finally {
    if (prev === undefined) {
      delete classes.Alpha;
    } else {
      classes.Alpha = prev;
    }
  }
}
function testNegZeroDistinctFromZero() {
  // Identity compares (no per-candidate serialization): `-0` and `+0`
  // pin distinct union members instead of merging like their identical
  // JSON spellings did. Validation is unaffected (`-0 === +0`).
  try {
    const templates = {T: {type: 'union', members: [-0, '"a"']}};
    const first = inspectTypeWithTemplates(-0, 'T', 'memoZero', 'v', templates);
    const second = inspectTypeWithTemplates(0, 'T', 'memoZero', 'v', templates);
    const pinned = templates.T;
    return first === true && second === true && pinned && typeof pinned === 'object' &&
      pinned.type === 'union' && pinned.members.length === 2 &&
      pinned.members.some((_) => Object.is(_, -0)) && pinned.members.some((_) => Object.is(_, 0) && !Object.is(_, -0));
  } finally {
    substitutedCache.clear();
  }
}
const tests = [
  testMemoStableAcrossRepeats,
  testBindingsDistinguishEntries,
  testMappingReflectsReregistration,
  testClassShapeReflectsReregistration,
  testNegZeroDistinctFromZero,
];
export {tests};
