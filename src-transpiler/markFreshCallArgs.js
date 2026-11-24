import {VISITOR_KEYS      } from '@babel/types';
import {isProbeCall       } from './isProbeCall.js';
import {nodeIsFunctionLike} from './nodeIsFunctionLike.js';
import {wrapNestedLiterals} from './wrapNestedLiterals.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Wraps fresh object and array literals in every argument list of the
 * given subtree, mutating in place and returning the same node. Probe
 * calls keep their metadata bare; every other call, optional call, new
 * expression and tagged template wraps its literal arguments. Function
 * boundaries stop the walk: bodies belong to the callee, never to the
 * caller's freshness. The wrap runs on the parsed AST before emission,
 * so closers, terminators, member suffixes and probe metadata survive
 * by construction instead of string-copy bookkeeping.
 * @param {Node|Node[]|null|undefined} node - Babel AST node or subtree.
 * @returns {Node|Node[]|null|undefined} The same node.
 * @example
 * import {parse} from '@babel/parser';
 * const program = parse('f({a: 1})').program;
 * markFreshCallArgs(program).body[0].expression.arguments[0].callee.name;
 * // 'markFresh'
 * @example
 * import {parse} from '@babel/parser';
 * const probe = parse("inspectType({a: 1}, 'o', 'l', 'n')").program;
 * markFreshCallArgs(probe).body[0].expression.arguments[0].type;
 * // 'ObjectExpression'
 */
function markFreshCallArgs(node) {
  if (Array.isArray(node)) {
    for (const entry of node) {
      markFreshCallArgs(entry);
    }
    return node;
  }
  if (!node || typeof node.type !== 'string') {
    return node;
  }
  const isCall = node.type === 'CallExpression' || node.type === 'OptionalCallExpression' || node.type === 'NewExpression';
  const wrapsCall = isCall && !isProbeCall(node);
  if (wrapsCall) {
    for (let index = 0; index < node.arguments.length; index++) {
      const argument = node.arguments[index];
      if (argument?.type === 'SpreadElement') {
        argument.argument = wrapNestedLiterals(argument.argument);
      } else {
        node.arguments[index] = wrapNestedLiterals(argument);
      }
    }
  }
  const tagProbe = {
    type: 'CallExpression',
    callee: node.tag,
  };
  const wrapsTag = node.type === 'TaggedTemplateExpression' && node.tag?.type === 'Identifier' && !isProbeCall(tagProbe);
  if (wrapsTag) {
    node.quasi = wrapNestedLiterals(node.quasi);
  }
  if (nodeIsFunctionLike(node)) {
    // Function boundaries stop the walk for bodies and default values, but
    // calls nested inside still take fresh literals: a caller's freshness
    // is decided at each call site, never by the enclosing scope.
    const params = node.params ?? [];
    for (const param of params) {
      if (param?.type === 'AssignmentPattern' && param.right) {
        // Default values read as fresh literals in tsc, so they wrap.
        param.right = wrapNestedLiterals(param.right);
      } else {
        markFreshCallArgs(param);
      }
    }
    if (node.body) {
      markFreshCallArgs(node.body);
    }
    return node;
  }
  const keys = VISITOR_KEYS[node.type] ?? [];
  for (const key of keys) {
    if (key === 'leadingComments' || key === 'trailingComments' || key === 'loc' || key === 'start' || key === 'end' || key === 'extra') {
      continue;
    }
    markFreshCallArgs(node[key]);
  }
  return node;
}
export {markFreshCallArgs};
