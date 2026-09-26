import {typedefs} from './registerTypedef.js';
import {getTypeKeys, instantiateReference, stripKey} from './getTypeKeys.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {recurse} from './validators.js';
import './validateType.js';
import {stringifyType} from './stringifyType.js';
const MAX_DEPTH = 3;
const MAX_MEMBERS = 12;
const MAX_PROPS = 20;
const MAX_KEYS = 60;
const MAX_NODES = 60;
const noop = () => undefined;
/**
 * Edit distance for "did you mean …?" key suggestions.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} Levenshtein distance.
 */
function editDistance(a, b) {
  const prev = Array.from({length: b.length + 1}, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = keep;
    }
  }
  return prev[b.length];
}
/**
 * Closest allowed key to a mistyped value, if close enough to suggest.
 * @param {string} value - The actual (wrong) key.
 * @param {string[]} keys - Allowed keys.
 * @returns {string|undefined} Suggestion or undefined.
 */
function suggestKey(value, keys) {
  if (typeof value !== 'string' || !keys.length) {
    return;
  }
  let best;
  for (const key of keys) {
    const dist = editDistance(value, key);
    if (best === undefined || dist < best.dist) {
      best = {key, dist};
    }
  }
  if (best && best.dist <= Math.max(1, Math.floor(best.key.length / 3))) {
    return best.key;
  }
}
/**
 * Short one-line type summary.
 * @param {*} expect - The type.
 * @returns {string} Summary.
 */
function treeSnip(expect) {
  try {
    const flat = stringifyType(expect);
    return flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
  } catch {
    return String(expect?.type ?? expect);
  }
}
/**
 * Pretty multi-line type for hover tooltips.
 * @param {*} expect - The type.
 * @returns {string} Full text.
 */
function treeFull(expect) {
  try {
    return stringifyType(expect, null, 2);
  } catch {
    return treeSnip(expect);
  }
}
/**
 * Silent pass/fail probe of a value against one tree node.
 * @param {*} value - The value.
 * @param {*} expect - The node type.
 * @returns {boolean|undefined} Result, undefined when untestable.
 */
function probe(value, expect) {
  try {
    return recurse(value, expect, 'tree', 'value', false, noop, 0);
  } catch {

  }
}
/**
 * Climbable type tree: every node names what the level IS (alias, keyof,
 * intersection member, …), resolves one step deeper, and probes the actual
 * value so failures pinpoint their level. Cycles stop via `seen` typedef
 * names plus depth/breadth/node budgets.
 * @param {*} expect - The type at this level.
 * @param {*} value - The actual value (probed per level).
 * @param {string} label - Display name for this level.
 * @param {object} budget - Shared `{depth, seen, nodes}` limits.
 * @returns {object} Tree node.
 */
function buildTypeTree(expect, value, label, budget = {depth: 0, seen: new Set(), nodes: 0}) {
  const node = {label, kind: 'leaf', summary: treeSnip(expect), full: treeFull(expect), passes: probe(value, expect)};
  if (++budget.nodes > MAX_NODES || budget.depth > MAX_DEPTH) {
    node.truncated = true;
    return node;
  }
  const next = {depth: budget.depth + 1, seen: budget.seen, nodes: budget.nodes};
  const sub = (type, name) => buildTypeTree(type, value, name, next);
  if (typeof expect === 'string') {
    if (budget.seen.has(expect) || !typedefs[expect]) {
      return node;
    }
    budget.seen.add(expect);
    node.kind = 'alias';
    node.detail = `Alias for ${treeSnip(typedefs[expect])}.`;
    node.children = [sub(typedefs[expect], treeSnip(typedefs[expect]))];
    budget.nodes = next.nodes;
    return node;
  }
  if (!expect || typeof expect !== 'object') {
    return node;
  }
  switch (expect.type) {
    case 'keyof': {
      node.kind = 'keyof';
      let keys;
      try {
        keys = getTypeKeys(expect, noop, 0);
      } catch {
        keys = undefined;
      }
      if (Array.isArray(keys)) {
        const names = keys.map(stripKey).filter((_) => typeof _ === 'string' || typeof _ === 'number');
        node.keys = names.slice(0, MAX_KEYS);
        node.moreKeys = names.length - node.keys.length;
        if (typeof value === 'string' || typeof value === 'number') {
          node.value = value;
          node.valueInKeys = node.keys.includes(value);
          if (!node.valueInKeys && typeof value === 'string') {
            node.suggestion = suggestKey(value, node.keys.filter((_) => typeof _ === 'string'));
          }
        }
        node.detail = `${names.length} allowed key${names.length === 1 ? '' : 's'}.`;
      }
      node.children = [sub(expect.argument, `keys of ${treeSnip(expect.argument)}`)];
      budget.nodes = next.nodes;
      return node;
    }
    case 'intersection':
    case 'union': {
      node.kind = expect.type;
      const members = (expect.members ?? []).slice(0, MAX_MEMBERS);
      node.detail = expect.type === 'intersection' ?
        `Must satisfy ALL ${members.length} members (✗ marks the failing one).` :
        `Must satisfy ANY member; ✗ marks failures, closest match first.`;
      node.children = members.map((_) => sub(_, treeSnip(_)));
      node.children.sort((a, b) => (a.passes === false ? 0 : 1) - (b.passes === false ? 0 : 1));
      budget.nodes = next.nodes;
      return node;
    }
    case 'reference': {
      node.kind = 'reference';
      let instance;
      try {
        instance = instantiateReference(expect, noop);
      } catch {
        instance = undefined;
      }
      if (instance === undefined) {
        return node;
      }
      node.detail = `${expect.name}<${(expect.args ?? []).map(treeSnip).join(', ')}> resolves to:`;
      node.children = [sub(instance, treeSnip(instance))];
      budget.nodes = next.nodes;
      return node;
    }
    case 'mapping': {
      node.kind = 'mapping';
      let made;
      try {
        made = createTypeFromMapping(expect, noop);
      } catch {
        made = undefined;
      }
      if (!made) {
        return node;
      }
      node.detail = 'Mapped type materializes to:';
      node.children = [sub(made, treeSnip(made))];
      budget.nodes = next.nodes;
      return node;
    }
    case 'object': {
      if (!expect.properties) {
        return node;
      }
      node.kind = 'object';
      const keys = Object.keys(expect.properties).slice(0, MAX_PROPS);
      node.moreKeys = Object.keys(expect.properties).length - keys.length;
      node.children = keys.map((_) => sub(expect.properties[_], `${_}: ${treeSnip(expect.properties[_])}`));
      budget.nodes = next.nodes;
      return node;
    }
    default:
      return node;
  }
}
export {buildTypeTree, suggestKey, editDistance};
