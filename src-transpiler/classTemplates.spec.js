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
// Class expressions inherit templates from the declaration comment,
// mirroring function-expression handling.
function testClassExpressionOnDeclaration() {
  const src = '/** @template {string} K */\n' +
    'const ExprBox = class {\n' +
    '  /** @param {K} x */\n' +
    '  constructor(x) { this.x = x; }\n' +
    '}';
  return runChecks(src, 'ExprBox', (scope, {hits, posted}) => {
    const before = hits.length;
    const good = new scope.ExprBox('a'); // ok
    if (good.x !== 'a' || hits.length !== before) {
      return false;
    }
    const bad = new scope.ExprBox(1); // warns
    if (bad.x !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// `export const Bla = class {...}` inherits templates from the export comment.
function testExportConstClassExpression() {
  const src = '/** @template {string} K */\n' +
    'export const ExportExpr = class {\n' +
    '  /** @param {K} x */\n' +
    '  constructor(x) { this.x = x; }\n' +
    '}';
  return runChecks(src, 'ExportExpr', (scope, {hits, posted}) => {
    const before = hits.length;
    const good = new scope.ExportExpr('a'); // ok
    if (good.x !== 'a' || hits.length !== before) {
      return false;
    }
    const bad = new scope.ExportExpr(1); // warns
    if (bad.x !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// `export default class Bla {...}` inherits templates too.
function testExportDefaultClass() {
  const src = '/** @template {string} K */\n' +
    'export default class DefaultBox {\n' +
    '  /** @param {K} x */\n' +
    '  constructor(x) { this.x = x; }\n' +
    '}';
  return runChecks(src, 'DefaultBox', (scope, {hits, posted}) => {
    const before = hits.length;
    const good = new scope.DefaultBox('a'); // ok
    if (good.x !== 'a' || hits.length !== before) {
      return false;
    }
    const bad = new scope.DefaultBox(1); // warns
    if (bad.x !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Nested classes resolve their NEAREST template: an expression-class with
// its own `@template` inside a declaration-class (and vice versa) infers
// from its own params, not the outer class.
function testNestedOwnTemplateBothKinds() {
  const exprInDecl = '/** @template {string} O */\n' +
    'class Outer {\n' +
    '  /** @param {O} o */\n' +
    '  constructor(o) {}\n' +
    '  make() {\n' +
    '    /** @template {number} I */\n' +
    '    const Inner = class {\n' +
    '      /** @param {I} x */\n' +
    '      constructor(x) { this.x = x; }\n' +
    '    };\n' +
    '    return Inner;\n' +
    '  }\n' +
    '}';
  const declInExpr = '/** @template {string} O */\n' +
    'const OuterE = class {\n' +
    '  /** @param {O} o */\n' +
    '  constructor(o) {}\n' +
    '  make() {\n' +
    '    /** @template {number} I */\n' +
    '    class Inner {\n' +
    '      /** @param {I} x */\n' +
    '      constructor(x) { this.x = x; }\n' +
    '    }\n' +
    '    return Inner;\n' +
    '  }\n' +
    '}';
  for (const [src, name] of [[exprInDecl, 'Outer'], [declInExpr, 'OuterE']]) {
    const ok = runChecks(src, name, (scope, {hits, posted}) => {
      const before = hits.length;
      const Inner = new scope[name]('o').make();
      const good = new Inner(1); // ok
      if (good.x !== 1 || hits.length !== before) {
        return false;
      }
      const bad = new Inner('s'); // warns: I is number
      if (bad.x !== 's' || hits.length !== before + 1) {
        return false;
      }
      return noneUnchecked(posted);
    });
    if (!ok) {
      return false;
    }
  }
  return true;
}
// An inner class without its own template sees the outer one.
function testInnerUsesOuterTemplate() {
  const src = '/** @template {string} K */\n' +
    'class Outer {\n' +
    '  /** @param {K} o */\n' +
    '  constructor(o) {}\n' +
    '  make() {\n' +
    '    const Inner = class {\n' +
    '      /** @param {K} x */\n' +
    '      constructor(x) { this.x = x; }\n' +
    '    };\n' +
    '    return Inner;\n' +
    '  }\n' +
    '}';
  return runChecks(src, 'Outer', (scope, {hits, posted}) => {
    const before = hits.length;
    const Inner = new scope.Outer('o').make();
    const good = new Inner('x'); // ok
    if (good.x !== 'x' || hits.length !== before) {
      return false;
    }
    const bad = new Inner(1); // warns: K is string
    if (bad.x !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Inner templates shadow outer ones on name conflict.
function testShadowedTemplate() {
  const src = '/** @template {string} K */\n' +
    'class Outer {\n' +
    '  /** @param {K} o */\n' +
    '  constructor(o) {}\n' +
    '  make() {\n' +
    '    /** @template {number} K */\n' +
    '    const Inner = class {\n' +
    '      /** @param {K} x */\n' +
    '      constructor(x) { this.x = x; }\n' +
    '    };\n' +
    '    return Inner;\n' +
    '  }\n' +
    '}';
  return runChecks(src, 'Outer', (scope, {hits, posted}) => {
    const before = hits.length;
    const Inner = new scope.Outer('o').make();
    const good = new Inner(1); // ok: inner K is number
    if (good.x !== 1 || hits.length !== before) {
      return false;
    }
    const bad = new Inner('s'); // warns
    if (bad.x !== 's' || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// A plain function nested in a generic method sees the method's template.
function testNestedFunctionSeesMethodTemplate() {
  const src = 'class A {\n' +
    '  /** @template T\n@param {T} x */\n' +
    '  method(x) {\n' +
    '    /** @param {T} y */\n' +
    '    function helper(y) { return y; }\n' +
    '    return helper(x);\n' +
    '  }\n' +
    '}';
  return runChecks(src, 'A', (scope, {hits, posted}) => {
    const before = hits.length;
    if (new scope.A().method('a') !== 'a' || hits.length !== before) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// The full chain: class > function > expression-class cross-referencing
// both the method-visible outer template and the inner one.
function testClassFnExprChain() {
  const src = '/** @template {string} O */\n' +
    'class Outer {\n' +
    '  /** @param {O} o */\n' +
    '  constructor(o) {}\n' +
    '  /** @param {O} o */\n' +
    '  make(o) {\n' +
    '    /** @param {O} t */\n' +
    '    function helper(t) {\n' +
    '      /** @template {number} I */\n' +
    '      const Inner = class {\n' +
    '        /** @param {I} x\n@param {O} y */\n' +
    '        constructor(x, y) { this.x = x; this.y = y; }\n' +
    '      };\n' +
    '      return new Inner(1, t);\n' +
    '    }\n' +
    '    return helper(o);\n' +
    '  }\n' +
    '}';
  return runChecks(src, 'Outer', (scope, {hits, posted}) => {
    const before = hits.length;
    const good = new scope.Outer('ok').make('ok'); // ok
    if (good.x !== 1 || good.y !== 'ok' || hits.length !== before) {
      return false;
    }
    const bad = new scope.Outer('ok').make(2); // warns: O is string
    if (bad.y !== 2 || hits.length === before) {
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
  testClassExpressionOnDeclaration,
  testExportConstClassExpression,
  testExportDefaultClass,
  testNestedOwnTemplateBothKinds,
  testInnerUsesOuterTemplate,
  testShadowedTemplate,
  testNestedFunctionSeesMethodTemplate,
  testClassFnExprChain,
];
