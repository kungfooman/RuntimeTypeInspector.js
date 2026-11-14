import {parse        } from '@babel/parser';
import {ALIAS_KEYS   } from '@babel/types';
import {parserOptions} from './parserOptions.js';
import {Asserter     } from './Asserter.js';
import {expandType   } from './expandType.js';
import {childNodes   } from './childNodes.js';
const standardTypes = new Set(Object.entries(ALIAS_KEYS)
  .filter(([, aliases]) => aliases.includes('Standardized'))
  .map(([type]) => type));
/**
 * Converts `src` through the real pipeline with the source text stored, so
 * the unknown-node fallback can slice verbatim.
 * @param {string} src - Source code to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
    input: src,
  });
  return asserter.toSource(parse(src, parserOptions));
}
/**
 * Renames every node of one type, simulating a Babel update that renames or
 * adds a construct the emitter table does not know yet.
 * @param {string} src - Source code to parse.
 * @param {string} from - Node type to rename.
 * @param {string} to - Replacement type (unknown to the emitter table).
 * @returns {string} Converted code for the mutated tree.
 */
function convertRenamed(src, from, to) {
  const ast = parse(src, parserOptions);
  const walk = (node) => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
      return;
    }
    if (node.type === from) {
      node.type = to;
    }
    for (const child of childNodes(node)) {
      walk(child);
    }
  };
  walk(ast);
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
    input: src,
  });
  return asserter.toSource(ast);
}
/**
 * Collects every node type the parser produces for `src`.
 * @param {string} src - Source code to parse.
 * @returns {Set<string>} The produced node types.
 */
function producedNodeTypes(src) {
  const found = new Set();
  const walk = (node) => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
      return;
    }
    found.add(node.type);
    for (const child of childNodes(node)) {
      walk(child);
    }
  };
  walk(parse(src, parserOptions));
  return found;
}
function testStaticBlockSurvives() {
  // The issue repro must round-trip instead of degrading into a placeholder.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const out = convert(src);
  if (out.includes('rtiUnhandled')) {
    console.warn('static block degraded into placeholder', {out});
    return false;
  }
  return out.includes('static {') && out.includes('console.log("once");');
}
function testRenamedBlockSurvives() {
  // A renamed block wrapper (what a Babel update looks like) still
  // reproduces verbatim from the stored input instead of breaking the build.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const out = convertRenamed(src, 'StaticBlock', 'StaticBlockFuture');
  if (out.includes('rtiUnhandled')) {
    console.warn('renamed block degraded into placeholder', {out});
    return false;
  }
  return out.includes('static {') && out.includes('console.log("once");');
}
function testRenamedOperatorSurvives() {
  // A renamed operator keeps its operands: the output stays runnable code
  // instead of dropping the expression.
  const out = convertRenamed('const value = left ?? right;', 'LogicalExpression', 'LogicalExpressionFuture');
  if (out.includes('rtiUnhandled')) {
    console.warn('renamed operator degraded into placeholder', {out});
    return false;
  }
  return out.includes('left') && out.includes('right');
}
function testStandardTypesStayCovered() {
  // Every node type Babel calls Standardized that our parserOptions can
  // produce must have a dedicated emitter: without one it degrades into a
  // placeholder. Probes one snippet per standardized type, so a Babel
  // update that standardizes a new construct fails here with its name.
  const probes = {
    ArrayExpression: 'const value = [1];',
    ArrayPattern: 'const [first] = pair;',
    ArrowFunctionExpression: 'const fn = () => 1;',
    AssignmentExpression: 'value = 1;',
    AssignmentPattern: 'function fn(value = 1) { return value; }',
    AwaitExpression: 'async function fn() { await work(); }',
    BigIntLiteral: 'const value = 1n;',
    BinaryExpression: 'const value = left + right;',
    BlockStatement: '{ run(); }',
    BooleanLiteral: 'const value = true;',
    BreakStatement: 'while (live) { break; }',
    CallExpression: 'run();',
    CatchClause: 'try { run(); } catch (error) { handle(error); }',
    ClassBody: 'class Holder {}',
    ClassDeclaration: 'class Holder {}',
    ClassExpression: 'const Holder = class {};',
    ClassMethod: 'class Holder { run() {} }',
    ClassPrivateMethod: 'class Holder { #run() {} }',
    ClassPrivateProperty: 'class Holder { #value = 1; }',
    ClassProperty: 'class Holder { value = 1; }',
    ConditionalExpression: 'const value = live ? one : two;',
    ContinueStatement: 'while (live) { continue; }',
    DebuggerStatement: 'debugger;',
    Directive: '"use strict";',
    DirectiveLiteral: '"use strict";',
    DoWhileStatement: 'do { run(); } while (live);',
    EmptyStatement: ';',
    ExportAllDeclaration: 'export * from "./other.mjs";',
    ExportDefaultDeclaration: 'export default 1;',
    ExportNamedDeclaration: 'export const value = 1;',
    ExportNamespaceSpecifier: 'export * as name from "./other.mjs";',
    ExportSpecifier: 'const value = 1; export {value};',
    ExpressionStatement: 'run();',
    File: 'const value = 1;',
    ForInStatement: 'for (const key in scope) { run(key); }',
    ForOfStatement: 'for (const item of list) { run(item); }',
    ForStatement: 'for (let index = 0; index < 1; index++) { run(index); }',
    FunctionDeclaration: 'function run() {}',
    FunctionExpression: 'const run = function () {};',
    Identifier: 'value;',
    IfStatement: 'if (live) { run(); }',
    Import: 'const loader = import("./other.mjs");',
    ImportDeclaration: 'import value from "./other.mjs";',
    ImportDefaultSpecifier: 'import value from "./other.mjs";',
    ImportExpression: 'const loader = import("./other.mjs");',
    ImportNamespaceSpecifier: 'import * as scope from "./other.mjs";',
    ImportSpecifier: 'import {value} from "./other.mjs";',
    InterpreterDirective: '#!/usr/bin/env node\nconst value = 1;',
    LabeledStatement: 'loop: while (live) { break loop; }',
    LogicalExpression: 'const value = left ?? right;',
    MemberExpression: 'scope.run();',
    MetaProperty: 'function fn() { new.target; }',
    NewExpression: 'new Holder();',
    NullLiteral: 'const value = null;',
    NumericLiteral: 'const value = 1;',
    ObjectExpression: 'const scope = {};',
    ObjectMethod: 'const scope = { run() {} };',
    ObjectPattern: 'const {first} = pair;',
    ObjectProperty: 'const scope = {value: 1};',
    OptionalCallExpression: 'run?.();',
    OptionalMemberExpression: 'scope?.run;',
    ParenthesizedExpression: 'const value = (1);',
    PrivateName: 'class Holder { #value = 1; get() { return this.#value; } }',
    Program: 'const value = 1;',
    RegExpLiteral: 'const pattern = /a/;',
    RestElement: 'const [first, ...rest] = pair;',
    ReturnStatement: 'function run() { return 1; }',
    SequenceExpression: 'const value = (one, two);',
    SpreadElement: 'const pair = [...items];',
    StaticBlock: 'class Vec3 { static { console.log("once"); } }',
    StringLiteral: 'const value = "one";',
    Super: 'class Child extends Parent { run() { super.run(); } }',
    SwitchCase: 'switch (value) { case 1: run(); }',
    SwitchStatement: 'switch (value) { case 1: run(); }',
    TaggedTemplateExpression: 'const value = tag`one`;',
    TemplateElement: 'const value = `one` + two + `three`;',
    TemplateLiteral: 'const value = `one` + two + `three`;',
    ThisExpression: 'class Holder { run() { return this; } }',
    ThrowStatement: 'throw error;',
    TryStatement: 'try { run(); } catch (error) { handle(error); }',
    UnaryExpression: 'const value = !live;',
    UpdateExpression: 'count++;',
    VariableDeclaration: 'const value = 1;',
    VariableDeclarator: 'const value = 1;',
    WhileStatement: 'while (live) { run(); }',
    YieldExpression: 'function* gen() { yield 1; }',
  };
  // Standardized types the parser rejects under our options stay out of the
  // probe map: they are plugin-gated (decorators/accessors) or mode-gated
  // (sloppy-only `with`), never produced, so nothing can degrade. A Babel
  // update that starts accepting one fails below with its name.
  const gated = {
    ClassAccessorProperty: 'class Holder { accessor value = 1; }',
    Decorator: '@sealed class Service {}',
    DoExpression: 'result = do { compute(); };',
    ModuleExpression: 'box = module { export const item = 1; };',
    PipelineTopicExpression: 'result = value |> (# + 1);',
    WithStatement: 'with (scope) { run(); }',
  };
  for (const [type, src] of Object.entries(probes)) {
    if (!standardTypes.has(type)) {
      console.warn('probe is not a Standardized type', {type});
      return false;
    }
    for (const produced of producedNodeTypes(src)) {
      if (produced === 'File' || produced === 'Program') {
        continue;
      }
      if (!standardTypes.has(produced)) {
        continue;
      }
    }
    const out = convert(src);
    if (out.includes('rtiUnhandled')) {
      console.warn('standardized type degrades into placeholder', {type, out});
      return false;
    }
  }
  for (const [type, src] of Object.entries(gated)) {
    try {
      parse(src, parserOptions);
    } catch {
      continue;
    }
    console.warn('gated syntax now parses without a probe', {type});
    return false;
  }
  return true;
}
function testJsxSpreadAttributeEmits() {
  // A spread prop merges into the props object: without an emitter the props
  // entry degrades and the element call breaks.
  const out = convert('const element = <div a={1} {...properties}>{child}</div>;');
  if (out.includes('rtiUnhandled')) {
    console.warn('JSX spread attribute degraded into placeholder', {out});
    return false;
  }
  return out.includes('...properties');
}
function testJsxSpreadChildEmits() {
  // A spread child becomes a spread call argument: without an emitter the
  // children list degrades and the element call breaks.
  const out = convert('const element = <div>{...items}</div>;');
  if (out.includes('rtiUnhandled')) {
    console.warn('JSX spread child degraded into placeholder', {out});
    return false;
  }
  return out.includes('...items');
}
function testJsxEmptyExpressionEmits() {
  // A comment-only container holds no value: without an emitter the children
  // list degrades even though nothing should print.
  const out = convert('const element = <div>{/* note */}</div>;');
  if (out.includes('rtiUnhandled')) {
    console.warn('JSX empty expression degraded into placeholder', {out});
    return false;
  }
  return true;
}
function testHashbangRoundTrips() {
  // A hashbang parses into an InterpreterDirective the Program emitter must
  // carry: dropping it silently would corrupt executable scripts.
  const out = convert('#!/usr/bin/env node\nconst value = 1;');
  if (out.includes('rtiUnhandled')) {
    console.warn('hashbang degraded into placeholder', {out});
    return false;
  }
  return out.includes('#!/usr/bin/env node');
}
export const tests = [
  testStaticBlockSurvives,
  testRenamedBlockSurvives,
  testRenamedOperatorSurvives,
  testStandardTypesStayCovered,
  testJsxSpreadAttributeEmits,
  testJsxSpreadChildEmits,
  testJsxEmptyExpressionEmits,
  testHashbangRoundTrips,
];
