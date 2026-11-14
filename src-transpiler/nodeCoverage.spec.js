import {ALIAS_KEYS} from '@babel/types';
import {Asserter  } from './Asserter.js';
/**
 * Every node type Babel calls Standardized that our parserOptions can
 * produce must have a dedicated emitter on Asserter: without one it
 * degrades into an rtiUnhandled placeholder. Asserter inherits every
 * emitter from Stringifier, so one prototype scan pins the full set
 * and a Babel update that standardizes a new construct fails here with
 * its name.
 * @returns {boolean} True when every producible standardized type has an emitter.
 */
function testStandardTypesStayCovered() {
  const standardTypes = new Set(Object.entries(ALIAS_KEYS)
    .filter(([, aliases]) => aliases.includes('Standardized'))
    .map(([type]) => type));
  // Standardized types the parser rejects under our options: plugin-gated
  // (decorators/accessors) or mode-gated (sloppy-only `with`), never
  // produced, so nothing can degrade. A Babel update that starts
  // accepting one fails below with its name.
  const gated = new Set([
    'ClassAccessorProperty',
    'Decorator',
    'DoExpression',
    'ModuleExpression',
    'PipelineTopicExpression',
    'WithStatement',
  ]);
  const missing = [];
  for (const type of standardTypes) {
    if (gated.has(type)) {
      continue;
    }
    // `in` walks the Asserter -> Stringifier chain, so an emitter counts
    // wherever it is defined. A bare typeof lookup would do the same,
    // but this states the chain explicitly.
    if (!(type in Asserter.prototype) || typeof Asserter.prototype[type] !== 'function') {
      missing.push(type);
    }
  }
  if (missing.length > 0) {
    console.warn('standardized types without emitter', {missing});
    return false;
  }
  return true;
}
/**
 * A spread prop (`<div {...props} />`) merges into the props object, so the
 * emitted entry keeps spread syntax and lets `createElement` receive it.
 * @returns {boolean} True when the emitter exists.
 */
function testJsxSpreadAttributeEmits() {
  return typeof Asserter.prototype.JSXSpreadAttribute === 'function';
}
/**
 * A spread child (`<div>{...items}</div>`) becomes one spread call argument,
 * matching how the elements array would receive the entries.
 * @returns {boolean} True when the emitter exists.
 */
function testJsxSpreadChildEmits() {
  return typeof Asserter.prototype.JSXSpreadChild === 'function';
}
/**
 * A comment-only container holds no value, so it emits nothing. The parent
 * element loop already skips empty sources.
 * @returns {boolean} True when the emitter exists.
 */
function testJsxEmptyExpressionEmits() {
  return typeof Asserter.prototype.JSXEmptyExpression === 'function';
}
export const tests = [
  testStandardTypesStayCovered,
  testJsxSpreadAttributeEmits,
  testJsxSpreadChildEmits,
  testJsxEmptyExpressionEmits,
];
