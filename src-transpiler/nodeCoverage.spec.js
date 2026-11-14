import {parse        } from '@babel/parser';
import {ALIAS_KEYS   } from '@babel/types';
import {parserOptions} from './parserOptions.js';
import {Asserter     } from './Asserter.js';
import {expandType   } from './expandType.js';
const standardTypes = new Set(Object.entries(ALIAS_KEYS)
  .filter(([, aliases]) => aliases.includes('Standardized'))
  .map(([type]) => type));
/**
 * Converts `src` through the real pipeline.
 * @param {string} src - Source code to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
  });
  return asserter.toSource(parse(src, parserOptions));
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
    WhileStatement: 'while (live) { continue; }',
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
  for (const type of standardTypes) {
    if (!(type in probes) && !(type in gated)) {
      console.warn('standardized type has no probe', {type});
      return false;
    }
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
export const tests = [
  testStandardTypesStayCovered,
  testJsxSpreadAttributeEmits,
  testJsxSpreadChildEmits,
  testJsxEmptyExpressionEmits,
];
