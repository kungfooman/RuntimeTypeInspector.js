import {nominalClassOf} from './nominalClassOf.js';
import {registerTypedef, typedefs, typedefTemplates} from './registerTypedef.js';
import {registerClass, classes} from './registerClass.js';
function clearTypedefs() {
  Object.keys(typedefs).forEach((key) => delete typedefs[key]);
  Object.keys(typedefTemplates).forEach((key) => delete typedefTemplates[key]);
}
class NomBase {
  constructor() {
    this.x = 0;
  }
}
class NomAlias {}
function testDirectClass() {
  // A registered class name resolves to its constructor.
  clearTypedefs();
  registerClass(NomBase);
  return nominalClassOf('NomBase') === NomBase;
}
function testUnknownName() {
  // Unregistered names resolve to undefined instead of throwing.
  clearTypedefs();
  return nominalClassOf('NomMissing') === undefined;
}
function testPrimitive() {
  // Primitives are never classes, even though validation handles them.
  clearTypedefs();
  return nominalClassOf('number') === undefined;
}
function testTypedefObject() {
  // Plain object typedefs stay structural: no constructor is returned.
  clearTypedefs();
  registerTypedef('NomBox', {type: 'object', properties: {a: 'number'}});
  return nominalClassOf('NomBox') === undefined;
}
function testAliasChain() {
  // String aliases are followed until the class (or a dead end).
  clearTypedefs();
  registerClass(NomAlias);
  registerTypedef('NomMid', 'NomAlias');
  registerTypedef('NomTop', 'NomMid');
  if (nominalClassOf('NomTop') !== NomAlias) {
    return false;
  }
  registerTypedef('NomDead', 'NomMissing');
  return nominalClassOf('NomDead') === undefined;
}
function testHarvestedPair() {
  // Harvested shapes share the class name: the constructor still wins so checks stay nominal.
  clearTypedefs();
  registerClass(NomBase);
  registerTypedef('NomBase', {type: 'object', properties: {x: 'number'}});
  return nominalClassOf('NomBase') === NomBase;
}
function testNonString() {
  // Nodes pass through untouched: only names can denote classes.
  clearTypedefs();
  return nominalClassOf({type: 'object', properties: {}}) === undefined;
}
const tests = [
  testDirectClass,
  testUnknownName,
  testPrimitive,
  testTypedefObject,
  testAliasChain,
  testHarvestedPair,
  testNonString
];
export {tests};
