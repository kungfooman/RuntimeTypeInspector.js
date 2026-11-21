import {parse             } from '@babel/parser';
import {parserOptions     } from './parserOptions.js';
import {resolveTypeBinding} from './resolveTypeBinding.js';
function testResolvesClassInScope() {
  const src = 'class Vec {} function step(d) { return d; }';
  const ast = parse(src, parserOptions);
  const fn = ast.program.body[1];
  const asserter = {
    parents: [ast.program, fn],
    toSource: (n) => n?.name ?? '',
  };
  return resolveTypeBinding(asserter, fn, 'Vec') === 'Vec';
}
function testResolvesDestructuredRequire() {
  const src = 'const {Vec, Body} = require("./shapes.js"); function step(b) { return b; }';
  const ast = parse(src, parserOptions);
  const fn = ast.program.body[1];
  const asserter = {
    parents: [ast.program, fn],
    toSource: (n) => n?.name ?? '',
  };
  return resolveTypeBinding(asserter, fn, 'Vec') === 'Vec';
}
function testUnresolvableStaysUndefined() {
  const src = 'function step(d) { return d; }';
  const ast = parse(src, parserOptions);
  const fn = ast.program.body[0];
  const a2 = {
    parents: [ast.program, fn],
    toSource: (n) => n?.name ?? '',
  };
  return resolveTypeBinding(a2, fn, 'Vec') === undefined;
}
function testTemplateParamHasNoBinding() {
  const src = 'class Box {} function put(v) { return v; }';
  const ast = parse(src, parserOptions);
  const fn = ast.program.body[1];
  const asserter = {
    parents: [ast.program, fn],
    toSource: (n) => n?.name ?? '',
  };
  return resolveTypeBinding(asserter, fn, 'K') === undefined;
}
function testDottedNameNeverResolves() {
  const src = 'const NS = {}; function step(d) { return d; }';
  const ast = parse(src, parserOptions);
  const fn = ast.program.body[1];
  const asserter = {
    parents: [ast.program, fn],
    toSource: (n) => n?.name ?? '',
  };
  return resolveTypeBinding(asserter, fn, 'NS.Vec') === undefined;
}
const tests = [
  testResolvesClassInScope,
  testResolvesDestructuredRequire,
  testUnresolvableStaysUndefined,
  testTemplateParamHasNoBinding,
  testDottedNameNeverResolves,
];
export {tests};
