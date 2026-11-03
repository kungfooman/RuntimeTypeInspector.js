import {parse} from '@babel/parser';
import {dummyArityHead} from './dummyArityHead.js';

// The wrapper head keeps dummy parameters before the stored rest carrier.
function testHeadKeepsDummyOrder() {
  const src = '(value) => value';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const head = dummyArityHead(arrow, 1, false, false);
  const actual = head.head;
  const expected = '(rtiParam0, ...rtiOverloadRest)';
  return actual === expected;
}

// Collisions in the arrow extend the dummy, rest, and stored carriers.
function testHeadAvoidsCollisions() {
  const src = '(rtiParam0, rtiOverloadRest, rtiOverloadStore) => rtiParam0';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const head = dummyArityHead(arrow, 1, false, false);
  const actual = [head.head, head.store, head.callName].join('|');
  const expected = '(rtiParam_0, ...rtiOverloadRest_)|const rtiOverloadStore_ = [rtiParam_0, ...rtiOverloadRest_];|rtiOverloadStore_';
  return actual === expected;
}

// The stored statement reads leading dummies before the stored rest.
function testStoreKeepsDummyOrder() {
  const src = '(value) => value';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const head = dummyArityHead(arrow, 1, false, false);
  const expected = 'const rtiOverloadStore = [rtiParam0, ...rtiOverloadRest];';
  const actual = head.store;
  return actual === expected;
}

// The async open joins the entry without shadowing its caller.
function testOpenEntryKeepsAsync() {
  const src = '(value) => value';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const head = dummyArityHead(arrow, 1, true, false);
  const wrapperHead = 'async (rtiParam0, ...rtiOverloadRest)';
  return (
    head.open === wrapperHead + ' => {' &&
    head.entry === 'return (async '
  );
}

// The invocation list forwards leading dummies before the stored rest.
function testInvocationKeepsDummyOrder() {
  const src = '(value) => value';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const head = dummyArityHead(arrow, 1, false, false);
  return head.invocation === 'rtiParam0, ...rtiOverloadRest';
}

export const tests = [testHeadKeepsDummyOrder, testHeadAvoidsCollisions, testStoreKeepsDummyOrder, testOpenEntryKeepsAsync, testInvocationKeepsDummyOrder];
