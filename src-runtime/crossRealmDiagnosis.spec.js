import vm from 'node:vm';
import {registerClass, classes} from './registerClass.js';
import {registerTypedef, typedefs, bumpTypedefVersion} from './registerTypedef.js';
import {tagSnapshot} from './tagSnapshot.js';
import {explainMismatch} from './explainMismatch.js';
import {unwrapTransparent} from './unwrapTransparent.js';
import {expandType} from '../src-transpiler/expandType.js';
class RealmColor {
  constructor() {
    Object.assign(this, {r: 0.95, g: 0.96, b: 0.98, a: 1});
  }
  clone() {
    return new RealmColor();
  }
  lerp() {
    return 1;
  }
}
class RealmVec4 {
  constructor() {
    Object.assign(this, {x: 0, y: 0, z: 0, w: 0});
  }
  dot() {
    return 0;
  }
}
class RealmVec2 {
  constructor() {
    Object.assign(this, {x: 0, y: 0});
  }
}
function prepareRealmTower() {
  for (const cls of [RealmColor, RealmVec4, RealmVec2]) {
    registerClass(cls);
  }
  // Shapes come through the parser like every other spec input, so a
  // parser regression breaks these tests instead of silently passing
  // against a stale hand-written shape. Harvest-equivalent shapes: data
  // props plus required method props, like the engine harvest the panel
  // resolves against.
  registerTypedef('RealmColor', expandType('{r: number, g: number, b: number, a: number, clone: Function, lerp: Function}'));
  registerTypedef('RealmVec4', expandType('{x: number, y: number, z: number, w: number, dot: Function}'));
  registerTypedef('RealmVec2', expandType('{x: number, y: number}'));
}
function realmDataExpect() {
  return expandType(`{
    anchor?: RealmVec4 | number[],
    color?: Readonly<RealmColor> | number[],
    margin?: RealmVec4 | number[],
    alignment?: RealmVec2,
  }`);
  // Wrapped like the real harvest spells getter/setter pairs: the
  // getter's `Readonly<Color>` wins over the setter's `Color`, while the
  // snapshot tag stays bare. The differ must unwrap the transparent
  // wrapper before the nominal match, mirroring validateReference.
}
function realmLiveValue() {
  return {
    anchor: [0, 0, 1, 1],
    color: new RealmColor(),
    margin: [14, 12, 14, 12],
    alignment: [0, 0],
  };
}
function realmFindingPaths(value) {
  const {findings} = explainMismatch(value, realmDataExpect(), 'data');
  return findings.map((finding) => `${finding.kind} ${finding.path}`);
}
// Foreign-realm arrays with a tagged snapshot must diff to exactly the
// genuinely failing alignment row: the arrays satisfy their number[]
// members across the realm boundary (brand check, not instanceof) and
// the tagged snapshot resolves nominally without counting its
// transport-stripped methods as defects. Before the fix this printed
// the three production phantom union rows (anchor, color, margin).
function testForeignArraysKeepSingleRow() {
  prepareRealmTower();
  const foreign = vm.runInNewContext('({anchor: [0, 0, 1, 1], margin: [14, 12, 14, 12]})');
  const tagged = tagSnapshot(realmLiveValue());
  const value = {
    anchor: foreign.anchor,
    color: structuredClone(tagged.color),
    margin: foreign.margin,
    alignment: [0, 0],
  };
  const paths = realmFindingPaths(value);
  return paths.length === 1 && paths[0] === 'wrong data.alignment';
}
// The normal structuredClone transport path stays single-row too.
function testClonedTransportKeepsSingleRow() {
  prepareRealmTower();
  const paths = realmFindingPaths(structuredClone(tagSnapshot(realmLiveValue())));
  return paths.length === 1 && paths[0] === 'wrong data.alignment';
}
// A panel registry without the engine classes still resolves the tagged
// snapshot by tag equality (the tag is the checker's nominal witness),
// so only the alignment row survives the missing registry as well.
function testMissingClassesKeepSingleRow() {
  prepareRealmTower();
  // Tagging happens checking-side with the full registry; the panel only
  // ever sees the tagged snapshot, so tag before wiping the classes.
  const transported = structuredClone(tagSnapshot(realmLiveValue()));
  const savedClasses = {...classes};
  for (const key of Object.keys(classes)) {
    delete classes[key];
  }
  bumpTypedefVersion();
  let paths;
  try {
    paths = realmFindingPaths(transported);
  } finally {
    Object.assign(classes, savedClasses);
    bumpTypedefVersion();
  }
  return paths.length === 1 && paths[0] === 'wrong data.alignment';
}
// A tagged snapshot with mistyped data still diffs clean inside a union:
// the checker accepts it nominally (the live instance satisfied the
// class), so any row would contradict the verdict. Only the union
// tag-equality shortcut grants this: revert it and the differ falls
// through to the structural walk, which flags the mistyped prop. The
// classes stay wiped so `snapshotMatches` cannot cover for the shortcut.
function testUnionTagMatchSkipsDataCheck() {
  prepareRealmTower();
  const transported = structuredClone(tagSnapshot(realmLiveValue()));
  transported.color.r = 'hot';
  const savedClasses = {...classes};
  for (const key of Object.keys(classes)) {
    delete classes[key];
  }
  bumpTypedefVersion();
  let paths;
  try {
    paths = realmFindingPaths(transported);
  } finally {
    Object.assign(classes, savedClasses);
    bumpTypedefVersion();
  }
  return paths.length === 1 && paths[0] === 'wrong data.alignment';
}
// A direct class expect materialized into a shape still exempts the
// transport-stripped methods by tag equality, with no union involved:
// the bare-string top-of-function shortcut never fires (materialization
// changed the node), so only the object-branch nominal match cleans it.
// Revert that line and the missing methods report as defects.
function testDirectShapeExemptsMethodsByTag() {
  prepareRealmTower();
  const transported = structuredClone(tagSnapshot({color: new RealmColor()}));
  const savedClasses = {...classes};
  for (const key of Object.keys(classes)) {
    delete classes[key];
  }
  bumpTypedefVersion();
  let findings;
  try {
    findings = explainMismatch(transported.color, 'RealmColor', 'data').findings;
  } finally {
    Object.assign(classes, savedClasses);
    bumpTypedefVersion();
  }
  return Array.isArray(findings) && findings.length === 0;
}
// Transparent wrappers unwrap to the nominal name they carry; anything
// that changes the runtime shape (Partial, bare strings pass through,
// non-wrappers) is not unwrapped.
function testUnwrapTransparent() {
  const readonlyColor = unwrapTransparent(expandType('Readonly<RealmColor>'));
  const nested = unwrapTransparent(expandType('NonNullable<NoInfer<RealmColor>>'));
  const bare = unwrapTransparent('RealmColor');
  const partial = unwrapTransparent(expandType('Partial<RealmColor>'));
  const plain = unwrapTransparent(expandType('{a: number}'));
  const empty = unwrapTransparent({type: 'reference', name: 'Readonly', args: []});
  return readonlyColor === 'RealmColor' && nested === 'RealmColor' &&
    bare === 'RealmColor' &&
    partial === undefined && plain === undefined && empty === undefined;
}
export const tests = [
  testUnwrapTransparent,
  testForeignArraysKeepSingleRow,
  testClonedTransportKeepsSingleRow,
  testMissingClassesKeepSingleRow,
  testUnionTagMatchSkipsDataCheck,
  testDirectShapeExemptsMethodsByTag,
];
