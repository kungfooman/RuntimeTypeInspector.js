import {substituteObject} from './substituteObject.js';
const noop = () => undefined;
// We want: object properties substitute, because each property value is a
// type position.
function testObjectProperties() {
  return JSON.stringify(substituteObject({type: 'object', properties: {a: 'K'}}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'object', properties: {a: '"a"'}});
}
// We want: index signatures substitute, because they are type positions
// just like properties.
function testObjectIndexSignatures() {
  const input = {type: 'object', indexSignatures: ['K']};
  return JSON.stringify(substituteObject(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'object', indexSignatures: ['"a"']});
}
// We want: an object with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testObjectUnchanged() {
  const input = {type: 'object', properties: {a: 'number'}};
  return substituteObject(input, 'K', '"a"', noop) === input;
}
// We want: nested object properties substitute recursively, because a
// property value may itself contain the search key at any depth.
function testObjectNested() {
  const input = {type: 'object', properties: {a: {type: 'array', elementType: 'K'}}};
  return JSON.stringify(substituteObject(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'object', properties: {a: {type: 'array', elementType: '"a"'}}});
}
const tests = [
  testObjectProperties,
  testObjectIndexSignatures,
  testObjectUnchanged,
  testObjectNested,
];
export {tests};
