import {registerTypedef} from './registerTypedef.js';
import {typedefs       } from './registerTypedef.js';
import {validateType   } from './validateType.js';
import {templateLiteralValues, resolveTemplateLiteralCandidates} from './validateTemplateLiteral.js';
import {expandType     } from '../src-transpiler/expandType.js';
/**
 * @param {Object<string, any>} obj - The object to clear.
 */
function clearObject(obj) {
  Object.keys(obj).forEach(_ => delete obj[_]);
}
function test1() {
  // Simple: template literal without interpolations
  const expect = {type: 'templateLiteral', quasis: ['id'], types: []};
  if (!validateType('id', expect, 'loc', 'name', true, () => undefined, 0)) {
    return false;
  }
  if (validateType('idx', expect, 'loc', 'name', true, () => undefined, 0)) {
    return false;
  }
  return true;
}
function test2() {
  // Single interpolation with an inline union of string literals
  const expect = {type: 'templateLiteral', quasis: ['', 'x'], types: [{type: 'union', members: ['"a"', '"b"']}]};
  const values = templateLiteralValues(expect, () => undefined);
  if (JSON.stringify(values) !== JSON.stringify(['ax', 'bx'])) {
    return false;
  }
  return validateType('bx', expect, 'loc', 'name', true, () => undefined, 0);
}
function test3() {
  // Multiple interpolations produce the full cross product
  const expect = {type: 'templateLiteral', quasis: ['', '_', ''], types: [
    {type: 'union', members: ['"a"', '"b"']},
    {type: 'union', members: ['"1"', '"2"']},
  ]};
  const values = templateLiteralValues(expect, () => undefined);
  const expected = ['a_1', 'a_2', 'b_1', 'b_2'];
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    return false;
  }
  return validateType('b_2', expect, 'loc', 'name', true, () => undefined, 0);
}
function test4() {
  // Interpolations can be nested template literals
  const expect = {type: 'templateLiteral', quasis: ['', '_', ''], types: [
    {type: 'templateLiteral', quasis: ['', '!'], types: [{type: 'union', members: ['"a"', '"b"']}]},
    {type: 'templateLiteral', quasis: ['~'], types: []},
  ]};
  const values = templateLiteralValues(expect, () => undefined);
  const expected = ['a!_~', 'b!_~'];
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    return false;
  }
  return true;
}
function test5() {
  // Number literals are stringified inside template literals
  const expect = {type: 'templateLiteral', quasis: ['v', ''], types: [{type: 'union', members: [1, 2]}]};
  if (!validateType('v1', expect, 'loc', 'name', true, () => undefined, 0)) {
    return false;
  }
  if (validateType('v3', expect, 'loc', 'name', true, () => undefined, 0)) {
    return false;
  }
  return true;
}
function test6() {
  // References to registered typedefs are resolved recursively
  clearObject(typedefs);
  registerTypedef('Lang', {type: 'union', members: ['"en"', '"ja"', '"pt"']});
  registerTypedef('AllLocaleIDs', {type: 'templateLiteral', quasis: ['', '_id'], types: [
    {type: 'union', members: ['"welcome_email"', '"email_heading"', '"footer_title"', '"footer_sendoff"']},
  ]});
  registerTypedef('LocaleMessageIDs', {
    type: 'templateLiteral',
    quasis: ['', '_', ''],
    types: ['Lang', 'AllLocaleIDs'],
  });
  const values = templateLiteralValues(typedefs.LocaleMessageIDs, () => undefined);
  // 3 langs x 4 ids = 12 permutations
  if (values?.length !== 12) {
    return false;
  }
  if (!values.includes('en_welcome_email_id') || !values.includes('pt_footer_sendoff_id')) {
    return false;
  }
  if (!validateType('pt_footer_sendoff_id', 'LocaleMessageIDs', 'loc', 'name', true, () => undefined, 0)) {
    return false;
  }
  return !validateType('xx_bad', 'LocaleMessageIDs', 'loc', 'name', true, () => undefined, 0);
}
function test7() {
  // Non-enumerable interpolations (like `string`) fail gracefully
  const expect = {type: 'templateLiteral', quasis: ['', '_'], types: ['string']};
  const values = templateLiteralValues(expect, () => undefined);
  if (values !== undefined) {
    return false;
  }
  let warnCalled = false;
  const ret = validateType('anything', expect, 'loc', 'name', true, () => warnCalled = true, 0);
  return ret === false && warnCalled === true;
}
function test8() {
  // expandType: transpiler produces the structured templateLiteral representation
  const noSubst = expandType('`id`');
  if (JSON.stringify(noSubst) !== JSON.stringify({type: 'templateLiteral', quasis: ['id'], types: []})) {
    return false;
  }
  const withSpans = expandType('`\${A | B}_\${C}`'); // eslint-disable-line no-template-curly-in-string
  const expected = {
    type: 'templateLiteral',
    quasis: ['', '_', ''],
    types: [{type: 'union', members: ['A', 'B']}, 'C'],
  };
  if (JSON.stringify(withSpans) !== JSON.stringify(expected)) {
    return false;
  }
  return true;
}
function test9() {
  // resolveTemplateLiteralCandidates handles primitive literal strings directly
  if (JSON.stringify(resolveTemplateLiteralCandidates('"foo"', () => undefined)) !== JSON.stringify(['foo'])) {
    return false;
  }
  if (JSON.stringify(resolveTemplateLiteralCandidates(true, () => undefined)) !== JSON.stringify(['true'])) {
    return false;
  }
  return true;
}
export const tests = [
  test1,
  test2,
  test3,
  test4,
  test5,
  test6,
  test7,
  test8,
  test9,
];
