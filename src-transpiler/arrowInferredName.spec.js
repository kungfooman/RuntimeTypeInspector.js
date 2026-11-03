import {parse} from '@babel/parser';
import {arrowInferredName} from './arrowInferredName.js';

// A variable declaration supplies the arrow's inferred name.
function testVariableName() {
  const src = 'const greet = (x) => x';
  const ast = parse(src);
  const declarator = ast.program.body[0].declarations[0];
  return arrowInferredName(declarator.init, declarator) === 'greet';
}

// A dynamic property key is unknown, while a literal key names the arrow.
function testDynamicPropertyName() {
  const src = `const obj = {
    [key]: (x) => x,
    ["fixed"]: (x) => x
  };`;
  const ast = parse(src);
  const object = ast.program.body[0].declarations[0].init;
  const dynamic = object.properties[0];
  const literal = object.properties[1];
  const dynamicName = arrowInferredName(dynamic.value, dynamic);
  const literalName = arrowInferredName(literal.value, literal);
  return (
    dynamicName === null &&
    literalName === 'fixed'
  );
}

// Private class fields prefix the inferred arrow name with a hash.
function testPrivateFieldName() {
  const src = `class Holder {
    #action = (x) => x;
  };`;
  const ast = parse(src);
  const field = ast.program.body[0].body.body[0];
  return arrowInferredName(field.value, field) === '#action';
}

export const tests = [testVariableName, testDynamicPropertyName, testPrivateFieldName];
