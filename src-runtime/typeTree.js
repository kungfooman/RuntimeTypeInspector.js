import {typedefs} from './registerTypedef.js';
import {getTypeKeys, instantiateReference, resolveObject, resolveUtilityShape, stripKey} from './getTypeKeys.js';
import {classes} from './registerClass.js';
import {mergedClassShape} from './classShape.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {recurse, validators} from './validators.js';
import './validateType.js';
import './evaluateCondition.js';
import {stringifyType} from './stringifyType.js';
const MAX_MEMBERS = 12;
const MAX_PROPS = 20;
const MAX_KEYS = 60;
const MAX_NODES = 200;
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
 * Decides a conditional type via the registered evaluator (same one
 * validation uses). Never throws: undecidable means undefined.
 * @param {*} expect - The `{type: 'condition', …}` object.
 * @returns {boolean|undefined} Branch decision.
 */
function decideCondition(expect) {
  try {
    return validators.evaluateCondition?.(expect.checkType, expect.extendsType, noop);
  } catch {
    return undefined;
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
 * value so failures pinpoint their level. Depth is unlimited — levels you
 * don't open cost nothing — while cycles (the only thing that could loop
 * forever) stop via path tracking: typedef names and object identities
 * currently being expanded above this node. Breadth stays capped
 * (members/props/keys, all labeled with their remainder) plus a global node
 * budget against combinatorial fan-out.
 * @param {*} expect - The type at this level.
 * @param {*} value - The actual value (probed per level).
 * @param {string} label - Display name for this level.
 * @param {object} budget - Shared `{nodes}` limit plus path stacks.
 * @returns {object} Tree node.
 */
function buildTypeTree(expect, value, label, budget = {nodes: 0, names: [], objs: []}) {
  const node = {label, kind: 'leaf', summary: treeSnip(expect), full: treeFull(expect), passes: probe(value, expect)};
  if (++budget.nodes > MAX_NODES) {
    node.truncated = true;
    return node;
  }
  // NB: no `= value` default below: missing keys pass explicit `undefined`
  // and defaults would re-substitute the parent object (the actual bug).
  const sub = (type, name, ...rest) => buildTypeTree(type, rest.length ? rest[0] : value, name, budget);
  if (typeof expect === 'string') {
    if (!typedefs[expect] && !classes[expect]) {
      return node;
    }
    if (budget.names.includes(expect)) {
      node.kind = 'alias';
      node.detail = 'Recursive reference — climb up to see it again.';
      return node;
    }
    budget.names.push(expect);
    try {
      if (typedefs[expect]) {
        node.kind = 'alias';
        node.detail = `Alias for ${treeSnip(typedefs[expect])}.`;
        node.children = [sub(typedefs[expect], treeSnip(typedefs[expect]))];
      } else {
        // Registered class: harvested constructor-chain shape merged with
        // prototype members, so methods and fields are climbable too.
        let shape;
        try {
          shape = mergedClassShape(expect);
        } catch {
          shape = undefined;
        }
        if (!shape || !shape.properties) {
          return node;
        }
        node.kind = 'class';
        node.detail = `Class ${expect} members (inherited first):`;
        node.children = [sub(shape, treeSnip(shape))];
      }
    } finally {
      budget.names.pop();
    }
    return node;
  }
  if (!expect || typeof expect !== 'object') {
    return node;
  }
  if (budget.objs.includes(expect)) {
    node.detail = 'Recursive structure — climb up to see it again.';
    return node;
  }
  budget.objs.push(expect);
  try {
    return buildObjectNode(expect, value, node, sub);
  } finally {
    budget.objs.pop();
  }
}
/**
 * Expands one materialized type level; split out so the path guards above
 * stay readable.
 * @param {*} expect - The object-shaped type.
 * @param {*} value - The actual value.
 * @param {object} node - The node being filled in.
 * @param {Function} sub - Child builder `(type, name) => node`.
 * @returns {object} The filled node.
 */
function buildObjectNode(expect, value, node, sub) {
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
      // The keyed object itself: the value is a key, not the object, so a
      // pass/fail probe would be noise — leave it unmarked but climbable.
      const keyed = sub(expect.argument, `keys of ${treeSnip(expect.argument)}`);
      keyed.passes = undefined;
      node.children = [keyed];
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
      return node;
    }
    case 'reference': {
      node.kind = 'reference';
      // Transparent wrappers don't change the runtime shape (same unwrap
      // `validateReference` performs) — descend instead of dead-ending.
      if ((expect.name === 'NonNullable' || expect.name === 'Readonly' || expect.name === 'NoInfer') && expect.args?.length) {
        node.detail = `${expect.name}<…> passes the shape through; unwraps to:`;
        node.children = [sub(expect.args[0], treeSnip(expect.args[0]))];
        return node;
      }
      // Utility wrappers materialize to concrete shapes (same semantics as
      // validation); anything else instantiates generic typedefs.
      if ((expect.name === 'Partial' || expect.name === 'Pick' || expect.name === 'Omit' || expect.name === 'Required') && expect.args?.length) {
        let shape;
        try {
          shape = resolveUtilityShape(expect.name, expect.args, noop, 0);
        } catch {
          shape = undefined;
        }
        if (shape !== undefined) {
          node.detail = `${expect.name}<${expect.args.map(treeSnip).join(', ')}> resolves to:`;
          node.children = [sub(shape, treeSnip(shape))];
          return node;
        }
      }
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
      return node;
    }
    case 'indexedAccess': {
      node.kind = 'indexedAccess';
      let shape;
      try {
        shape = resolveObject(expect, noop, 0);
      } catch {
        shape = undefined;
      }
      if (!shape) {
        return node;
      }
      node.detail = `${treeSnip(expect)} selects:`;
      node.children = [sub(shape, treeSnip(shape))];
      return node;
    }
    case 'condition': {
      node.kind = 'condition';
      const decision = decideCondition(expect);
      node.decision = decision;
      const ifTrue = sub(expect.trueType, `true: ${treeSnip(expect.trueType)}`);
      const ifFalse = sub(expect.falseType, `false: ${treeSnip(expect.falseType)}`);
      ifTrue.entered = decision === true;
      ifFalse.entered = decision === false;
      // Both branches render so the conditional itself stays inspectable;
      // the entered one sorts first and gets marked in the renderer.
      node.children = decision === false ? [ifFalse, ifTrue] : [ifTrue, ifFalse];
      if (decision === undefined) {
        node.detail = 'Undecidable here — both branches shown:';
      } else {
        node.detail = `Check ${decision ? 'holds' : 'fails'} — entered branch first:`;
      }
      return node;
    }
    case 'mapping': {      node.kind = 'mapping';
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
      return node;
    }
    case 'object': {
      if (!expect.properties) {
        return node;
      }
      node.kind = 'object';
      const keys = Object.keys(expect.properties).slice(0, MAX_PROPS);
      node.moreKeys = Object.keys(expect.properties).length - keys.length;
      // Probe each property against ITS value, not the whole parent object.
      const childValue = value != null && typeof value === 'object' ? value : {};
      node.children = keys.map((_) => sub(expect.properties[_], `${_}: ${treeSnip(expect.properties[_])}`, childValue[_]));
      return node;
    }
    default:
      return node;
  }
}
export {buildTypeTree, suggestKey, editDistance};
