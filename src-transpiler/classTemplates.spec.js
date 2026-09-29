import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {runChecks, noneUnchecked} from './executeChecks.js';
// `@template {Constraint} [K=Default]` keeps the constraint: the default
// only applies when nothing is inferred (issue #265 parsed this as
// undefined, so the whole class went unchecked).
function testConstrainedDefaultKeepsConstraint() {
  const templates = parseJSDocTemplates('@template {AssetType | (string & {})} [K=string]');
  if (!templates || typeof templates.K !== 'object' || templates.K.type !== 'union') {
    return false;
  }
  if (!templates.K.members.includes('AssetType')) {
    return false;
  }
  const bare = parseJSDocTemplates('@template {string} [K=string]');
  return bare?.K === 'string';
}
// The exact issue shape: `new Asset('cube', 'container')` passes,
// `new Asset('cube', 123)` fails against the union constraint — and the
// failure names `AssetType`, proving the constraint (not the default) won.
function testIssueAsset() {
  const src = '/** @typedef {string} AssetType */\n' +
    '/** @template {AssetType | (string & {})} [K=string] */\n' +
    'class Asset {\n' +
    '  /** @param {string} name\n@param {K} type */\n' +
    '  constructor(name, type) { this.type = type; }\n' +
    '}';
  return runChecks(src, 'Asset', (scope, {hits, posted}) => {
    const before = hits.length;
    const asset = new scope.Asset('cube', 'container'); // ok
    if (asset.type !== 'container' || hits.length !== before) {
      return false;
    }
    const bad = new scope.Asset('cube', 123); // warns, fail-open
    if (bad.type !== 123 || hits.length !== before + 1) {
      return false;
    }
    if (!posted.some((msg) => (msg.strings ?? []).join(' ').includes('AssetType'))) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Constructor and method share the class template: `new Box(1)` warns,
// `set('b')` passes on a fresh per-call inference.
function testBoxConstructorAndMethod() {
  const src = '/** @template {string} K */\n' +
    'class Box {\n' +
    '  /** @param {K} value */\n' +
    '  constructor(value) { this.value = value; }\n' +
    '  /** @param {K} value */\n' +
    '  set(value) { this.value = value; }\n' +
    '}';
  return runChecks(src, 'Box', (scope, {hits, posted}) => {
    const before = hits.length;
    const box = new scope.Box('a'); // ok
    box.set('b'); // ok
    if (box.value !== 'b' || hits.length !== before) {
      return false;
    }
    const bad = new scope.Box(1); // warns
    if (bad.value !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Class templates survive `export` wrappers.
function testExportedClass() {
  const src = '/** @template {string} K */\n' +
    'export class ExportedBox {\n' +
    '  /** @param {K} x */\n' +
    '  constructor(x) { this.x = x; }\n' +
    '}';
  return runChecks(src, 'ExportedBox', (scope, {hits, posted}) => {
    const before = hits.length;
    const good = new scope.ExportedBox('a'); // ok
    if (good.x !== 'a' || hits.length !== before) {
      return false;
    }
    const bad = new scope.ExportedBox(1); // warns
    if (bad.x !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Bare class template infers anything, then pins it per call.
function testBareClassTemplate() {
  const src = '/** @template K */\n' +
    'class Bare {\n' +
    '  /** @param {K} x */\n' +
    '  constructor(x) { this.x = x; }\n' +
    '}';
  return runChecks(src, 'Bare', (scope, {hits, posted}) => {
    const before = hits.length;
    const a = new scope.Bare('x'); // ok
    const b = new scope.Bare(1); // ok: K pins per call
    if (a.x !== 'x' || b.x !== 1 || hits.length !== before) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Joint inference across constructor params (`new Pair('a', 'b')` widens
// `K` to string, `new Pair('a', 1)` warns) and method-local `@template`
// shadowing the class one (`mixed('x', 'y')` warns: `T` is number).
function testPairJointInference() {
  const src = '/** @template {string} K */\n' +
    'class Pair {\n' +
    '  /** @param {K} a\n@param {K} b */\n' +
    '  constructor(a, b) { this.pair = [a, b]; }\n' +
    '  /** @template {number} T\n@param {T} x\n@param {K} y */\n' +
    '  mixed(x, y) { return [x, y]; }\n' +
    '}';
  return runChecks(src, 'Pair', (scope, {hits, posted}) => {
    const before = hits.length;
    const p = new scope.Pair('a', 'a'); // ok
    const q = new scope.Pair('a', 'b'); // ok: widens to string
    const [mx, my] = new scope.Pair('a', 'a').mixed(1, 'x'); // ok
    if (p.pair[0] !== 'a' || q.pair[1] !== 'b' || mx !== 1 || my !== 'x' || hits.length !== before) {
      return false;
    }
    const bad = new scope.Pair('a', 1); // warns
    const [nx, ny] = new scope.Pair('a', 'a').mixed('x', 'y'); // warns: T is number
    if (bad.pair[1] !== 1 || nx !== 'x' || ny !== 'y' || hits.length !== before + 2) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
export const tests = [
  testConstrainedDefaultKeepsConstraint,
  testIssueAsset,
  testBoxConstructorAndMethod,
  testExportedClass,
  testBareClassTemplate,
  testPairJointInference,
];
