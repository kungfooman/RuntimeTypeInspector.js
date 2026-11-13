import {parse       } from '@babel/parser';
import {freshKeyName} from './freshKeyName.js';
// A collision in the property source extends the key carrier name.
function testKeyCollisionExtendsName() {
  const src = 'const holder = {[rtiOverloadKey]: (value) => value};';
  const ast = parse(src);
  const holder = ast.program.body[0].declarations[0].init;
  const [property] = holder.properties;
  return freshKeyName(property) === 'rtiOverloadKey_';
}
// A clean property keeps the preferred key carrier name.
function testKeyCleanKeepsName() {
  const src = 'const holder = {[key]: (value) => value};';
  const ast = parse(src);
  const holder = ast.program.body[0].declarations[0].init;
  const [property] = holder.properties;
  return freshKeyName(property) === 'rtiOverloadKey';
}
export const tests = [testKeyCollisionExtendsName, testKeyCleanKeepsName];
