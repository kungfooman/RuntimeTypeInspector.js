import {variables} from "./registerVariable.js";
import {typedefs, typedefTemplates} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {mergedClassShape} from "./classShape.js";
import {replaceType} from "./replaceType.js";
import {validators} from "./validators.js";
/** Module-local nesting guard: materialize funnels back through here. */
let mappingDepth = 0;
function stripKey(key) {
  return typeof key === 'string' && key.length >= 2 && (key[0] === "'" && key[key.length - 1] === "'" || key[0] === '"' && key[key.length - 1] === '"') ? key.slice(1, -1) : key;
}
/**
 * Key NAMES for object-ish types. Indexed access resolves to keys of the
 * denoted value (e.g. `Map["camera"]` yields shape keys, not prop types).
 * Unions yield concatenated names (a superset approximation, documented:
 * safe direction for validation, not exact keyof identities).
 * @param {*} target - The type to read names from.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {string[]|undefined} Names or undefined.
 */
function resolveKeys(target, warn, depth) {
  if (depth > 25) {
    warn('resolveKeys: exceeded depth, possible circular type.');
    return;
  }
  if (typeof target === 'string') {
    if (typedefs[target]) {
      return resolveKeys(typedefs[target], warn, depth + 1);
    }
    const stripped = stripKey(target);
    if (stripped !== target) {
      return [stripped];
    }
    return;
  }
  if (!target || typeof target !== 'object') {
    return;
  }
  if (target.type === undefined) {
    // Bare `{}` (e.g. a conditional false-branch) is the empty object type.
    return Object.keys(target.properties ?? {});
  }
  if (target.type === 'object') {
    return Object.keys(target.properties ?? {});
  }
  if (target.type === 'mapping') {
    return getTypeKeys(target, warn, depth + 1);
  }
  if (target.type === 'indexedAccess') {
    const {index} = target;
    let {object} = target;
    if (typeof object === 'string' && typedefs[object]) {
      object = typedefs[object];
    }
    if (object && object.type === 'mapping') {
      const materialize = validators.materializeMapping;
      if (materialize) {
        object = materialize(object, warn);
      }
    }
    if (!object || !object.properties) {
      return;
    }
    const names = getTypeKeys(index, warn, depth + 1);
    if (!names) {
      return;
    }
    // Keys OF each selected value (not the index names): union members are
    // resolved per value so `Pick<Map["camera"], …>` sees CamShape keys.
    const keys = [];
    for (const name of names) {
      const key = stripKey(name);
      if (typeof key !== 'string' || !(key in object.properties)) {
        continue;
      }
      const sub = resolveKeys(object.properties[key], warn, depth + 1);
      if (sub) {
        keys.push(...sub);
      }
    }
    return [...new Set(keys)];
  }
  if (target.type === 'union' && Array.isArray(target.members)) {
    const keys = [];
    for (const member of target.members) {
      const sub = resolveKeys(member, warn, depth + 1);
      if (sub) {
        keys.push(...sub);
      }
    }
    return [...new Set(keys)];
  }
  if (target.type === 'reference' || target.type === 'keyof' || target.type === 'condition') {
    if (target.type === 'reference' && (target.name === 'NonNullable' || target.name === 'Readonly' || target.name === 'NoInfer') && target.args?.length) {
      return resolveKeys(target.args[0], warn, depth + 1);
    }
    return getTypeKeys(target, warn, depth + 1);
  }
}
/**
 * Key names from a key type: literal unions stripped, rest resolved.
 * @param {*} keys - The key type.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {string[]|undefined} Names or undefined.
 */
function keyNames(keys, warn, depth) {
  if (keys && keys.type === 'union' && Array.isArray(keys.members)) {
    return keys.members.map(stripKey).filter(key => typeof key === 'string');
  }
  if (keys && keys.type === 'reference' && keys.name === 'Extract') {
    return keysOfExtract(keys, warn, depth);
  }
  const resolved = getTypeKeys(keys, warn, depth + 1);
  if (!resolved) {
    return;
  }
  return resolved.map(stripKey).filter(key => typeof key === 'string');
}
/**
 * Instantiates a generic typedef reference by substituting arguments for
 * template parameters. Shared by reference resolution paths.
 * @param {object} type - Reference with name and args.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {object|undefined} Instantiated struct or undefined when N/A.
 */
function instantiateReference(type, warn) {
  const {name, args} = type;
  if (!typedefs[name]) {
    return;
  }
  const params = typedefTemplates[name];
  if (!params?.length || !args?.length) {
    return typedefs[name];
  }
  let instance = structuredClone(typedefs[name]);
  params.forEach((param, i) => {
    instance = replaceType(instance, param, i < args.length ? args[i] : 'any', warn);
  });
  return instance;
}
/**
 * Resolves a type to an object shape for key reading. Narrower than full
 * materialization: unions, utilities and unresolvable shapes yield undefined.
 * @param {*} type - The type to resolve.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {object|undefined} Object shape or undefined.
 */
function resolveObject(type, warn, depth) {
  if (depth > 25) {
    warn('resolveObject: exceeded depth, possible circular type.');
    return;
  }
  if (typeof type === 'string') {
    // Class names merge harvested shapes up the constructor chain, so
    // `keyof` sees inherited members too. Plain typedefs resolve as before.
    if (classes[type]) {
      return mergedClassShape(type);
    }
    if (!typedefs[type]) {
      return;
    }
    return resolveObject(typedefs[type], warn, depth + 1);
  }
  if (!type || typeof type !== 'object') {
    return;
  }
  if (type.type === 'object') {
    return type;
  }
  if (type.type === 'mapping') {
    const materialize = validators.materializeMapping;
    if (!materialize) {
      return;
    }
    return materialize(type, warn) ?? undefined;
  }
  if (type.type === 'indexedAccess') {
    const {index} = type;
    let object = type.object;
    if (typeof object === 'string' && typedefs[object]) {
      object = typedefs[object];
    }
    if (object && object.type === 'mapping') {
      const materialize = validators.materializeMapping;
      if (materialize) {
        object = materialize(object, warn);
      }
    }
    const resolved = resolveObject(object, warn, depth + 1);
    if (!resolved || !resolved.properties) {
      return;
    }
    const names = getTypeKeys(index, warn, depth + 1);
    if (!Array.isArray(names) || names.length !== 1) {
      return;
    }
    const prop = resolved.properties[stripKey(names[0])];
    if (prop === undefined) {
      return;
    }
    return resolveObject(prop, warn, depth + 1);
  }
  if (type.type === 'reference') {
    const {name, args} = type;
    if ((name === 'NonNullable' || name === 'Readonly' || name === 'NoInfer') && args?.length) {
      return resolveObject(args[0], warn, depth + 1);
    }
    const instance = instantiateReference(type, warn);
    if (instance === undefined) {
      return;
    }
    return resolveObject(instance, warn, depth + 1);
  }
}
/**
 * Key names from an Extract: members surviving the extends check, as names.
 * Undecidable members are skipped with a warning: a key list cannot hold
 * maybe-values, unlike validation which fails open.
 * @param {object} expect - Extract reference with args.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {Array|undefined} Names or undefined.
 */
/**
 * Keys of indexed access over a conditional-valued mapping: per candidate
 * key, substitute into the result and keep it unless it decides false.
 * Undecidable keys are kept with a warning (fail-open, like validation).
 * @param {object} access - Indexed access with a mapping object.
 * @param {*} from - The original from-side (nominator source).
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {string[]|undefined} Kept keys or undefined.
 */
function keysOfConditionalMapping(access, from, warn, depth) {
  const decide = validators.decideIfEquals;
  const evaluate = validators.evaluateCondition;
  const mapping = access.object;
  const element = mapping.element;
  if (typeof element !== 'string') {
    return;
  }
  let candidates;
  if (from?.type === 'reference' && from.args?.length) {
    const nominator = resolveObject(from.args[0], warn, depth + 1);
    if (nominator && nominator.properties) {
      candidates = Object.keys(nominator.properties);
    }
  }
  if (!candidates) {
    const direct = getTypeKeys(mapping.iterable, warn, depth + 1) ?? [];
    candidates = direct.filter((key) => typeof key === 'string').map(stripKey);
  }
  if (!candidates) {
    return;
  }
  const kept = [];
  for (const key of candidates) {
    const result = structuredClone(mapping.result);
    replaceType(result, element, `"${key}"`, warn);
    if (result?.type === 'reference' && result.name === 'IfEquals') {
      if (!decide) {
        return;
      }
      const [X, Y] = result.args ?? [];
      if (X === undefined || Y === undefined) {
        kept.push(key);
        continue;
      }
      const decision = decide(X, Y, warn);
      if (decision === false) {
        continue;
      }
      if (decision === undefined) {
        warn('keysOfConditionalMapping: undecidable member, keeping.', {key});
      }
      kept.push(key);
      continue;
    }
    if (result?.type === 'condition') {
      if (!evaluate) {
        return;
      }
      const decision = evaluate(result.checkType, result.extendsType, warn);
      if (decision === false) {
        continue;
      }
      if (decision === undefined) {
        warn('keysOfConditionalMapping: undecidable member, keeping.', {key});
      }
      kept.push(key);
      continue;
    }
    kept.push(key);
  }
  return kept;
}
function keysOfExtract(expect, warn, depth) {
  var _expect$args;
  const [from, to] = (_expect$args = expect.args) != null ? _expect$args : [];
  if (from === undefined || to === undefined) {
    return;
  }
  let target = from;
  if (target?.type === 'reference') {
    const instance = instantiateReference(target, warn);
    if (instance === undefined) {
      return;
    }
    target = instance;
  }
  if (target?.type === 'indexedAccess' && target.object?.type === 'mapping' && target.object?.nameType !== undefined) {
    // Key-remapping (`as` clause) filters keys by branch: handled below.
    // Plain value mappings fall through to member filtering instead.
    return keysOfConditionalMapping(target, from, warn, depth);
  }
  const evaluate = validators.evaluateCondition;
  const fromKeys = getTypeKeys(from, warn, depth + 1);
  if (!fromKeys) {
    return;
  }
  const kept = [];
  for (const member of fromKeys) {
    if (typeof member === 'string') {
      const stripped = stripKey(member);
      if (stripped !== member) {
        if (!evaluate) {
          return;
        }
        const decision = evaluate(member, to, warn);
        if (decision === false) {
          continue;
        }
        if (decision === true) {
          kept.push(stripped);
          continue;
        }
        warn('keysOfExtract: undecidable member, skipping.', {
          member
        });
        continue;
      }
      // Bare keys validate as their literal against the target union.
      // (Inline literalType: evaluateCondition imports this module, so a
      // static import would cycle back here.)
      if (!evaluate) {
        return;
      }
      const decision = evaluate(typedefs[member] ? member : `"${member}"`, to, warn);
      if (decision === false) {
        continue;
      }
      if (decision === true) {
        kept.push(member);
        continue;
      }
      warn('keysOfExtract: undecidable member, skipping.', {
        member
      });
      continue;
    }
    if (member && member.type === 'condition') {
      if (!evaluate) {
        return;
      }
      const decision = evaluate(member.checkType, member.extendsType, warn);
      if (decision === false) {
        continue;
      }
      if (decision === true) {
        const name = branchNameOf(member.trueType);
        if (name !== undefined) {
          kept.push(name);
        }
        continue;
      }
      warn('keysOfExtract: undecidable member, skipping.', {
        member
      });
      continue;
    }
    warn('keysOfExtract: unnameable member, skipping.', {
      member
    });
  }
  return kept;
}
/**
 * Property key from a substituted true-branch, if it is a plain name.
 * @param {*} type - The true-branch type.
 * @returns {string|number|undefined} Key or undefined.
 */
function branchNameOf(type) {
  if (typeof type === 'number') {
    return type;
  }
  if (typeof type === 'string') {
    const stripped = stripKey(type);
    if (stripped !== type) {
      return stripped;
    }
  }
}
/**
 * Key lists for Partial/Pick/Omit without materializing objects.
 * @param {string} name - Partial, Pick or Omit.
 * @param {any[]} args - Type arguments.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {string[]|undefined} Keys or undefined.
 */
function keysOfUtility(name, args, warn, depth) {
  const [target, keys] = args != null ? args : [];
  if (keys === undefined && name !== 'Partial') {
    return;
  }
  if (name === 'Pick') {
    // Pick keys are K, intersected with the base when resolvable.
    const _names = keyNames(keys, warn, depth);
    if (!_names) {
      return;
    }
    if (target === undefined) {
      return _names;
    }
    const _base = resolveKeys(target, warn, depth + 1);
    if (!_base) {
      return _names;
    }
    const valid = new Set(_base);
    return _names.filter(key => valid.has(key));
  }
  if (target === undefined) {
    return;
  }
  const base = resolveKeys(target, warn, depth + 1);
  if (!base) {
    return;
  }
  if (name === 'Partial') {
    return [...base];
  }
  const names = keyNames(keys, warn, depth);
  if (!names) {
    return;
  }
  const wanted = new Set(names);
  return base.filter(key => !wanted.has(key));
}
/**
 * @example
 * getTypeKeys({type: 'typeof', argument: 'DataTypeMap'}, console.warn);
 * // Or simpler:
 * getTypeKeys(expandType("typeof DataTypeMap"));
 * getTypeKeys(expandType("1|2|3"));
 * @param {*} expect - The type.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {string[]|undefined} Keys or undefined.
 */
function getTypeKeys(expect, warn, depth = 0) {
  if (depth > 25) {
    warn('getTypeKeys: exceeded depth, possible circular type.');
    return;
  }
  if (typeof expect === 'string') {
    // Quoted literal: its own key, e.g. `Entity["camera"]` looks up `camera`.
    if (expect.length >= 2 && (expect[0] === "'" && expect[expect.length - 1] === "'" || expect[0] === '"' && expect[expect.length - 1] === '"')) {
      return [expect.slice(1, -1)];
    }
    if (typedefs[expect]) {
      const typedef = typedefs[expect];
      return getTypeKeys(typedef, warn, depth + 1);
      //warn("getTypeKeys: Unhandled typedef", {expect, typedef});
      //return;
    }

    warn("getTypeKeys> 'expect' was a string but not a typedef, unhandled case.");
    return;
  }
  const {
    type
  } = expect;
  if (type === 'typeof') {
    const varName = expect.argument;
    const variable = variables[varName];
    if (variable === undefined) {
      warn(`Can't find variable named '${varName}'.`);
      return;
    }
    return Object.keys(variable);
  } else if (type === 'union') {
    return expect.members;
  } else if (type === 'object') {
    var _expect$properties;
    return Object.keys((_expect$properties = expect.properties) != null ? _expect$properties : {});
  } else if (type === 'keyof') {
    const {
      argument
    } = expect;
    //console.log("want key for", argument);
    return getTypeKeys(argument, warn, depth + 1);
  } else if (type === 'intersection' && Array.isArray(expect.members)) {
    // keyof (A & B) is keyof A | keyof B: concat member keys. Bare
    // primitives (`& string` alias identities) contribute no keys.
    const primitives = new Set(['string', 'number', 'boolean', 'bigint', 'symbol']);
    const keys = [];
    for (const member of expect.members) {
      if (typeof member === 'string' && primitives.has(member)) {
        continue;
      }
      const sub = getTypeKeys(member, warn, depth + 1);
      if (!sub) {
        return;
      }
      keys.push(...sub);
    }
    return [...new Set(keys)];
  } else if (type === 'reference') {
    // Instantiate generic typedefs (e.g. MergedComponentOptions<"camera">),
    // follow plain ones, resolve utilities to key lists directly.
    // Classes stay out: constructors don't retain members.
    const {
      name,
      args
    } = expect;
    if ((name === 'NonNullable' || name === 'Readonly' || name === 'NoInfer') && args?.length) {
      return getTypeKeys(args[0], warn, depth + 1);
    }
    if (name === 'Omit' || name === 'Pick' || name === 'Partial') {
      return keysOfUtility(name, args, warn, depth + 1);
    }
    if (name === 'Extract') {
      return keysOfExtract(expect, warn, depth + 1);
    }
    if (name === 'IfEquals') {
      // Identity comparison for WritableKeys-style filtering. Missing A/B
      // fall back to the TypeScript defaults (A=X, B=never).
      const decide = validators.decideIfEquals;
      const [X, Y, A, B] = args ?? [];
      if (X === undefined || Y === undefined || !decide) {
        return;
      }
      const decision = decide(X, Y, warn);
      if (decision === true) {
        return resolveKeys(A ?? X, warn, depth + 1);
      }
      if (decision === false) {
        return resolveKeys(B ?? 'never', warn, depth + 1);
      }
      return;
    }
    const instance = instantiateReference(expect, warn);
    if (instance === undefined) {
      warn(`Couldn't get keys for type`, expect);
      return;
    }
    return getTypeKeys(instance, warn, depth + 1);
  } else if (type === 'condition') {
    // Evaluate through the table (a static import would cycle back here).
    const evaluate = validators.evaluateCondition;
    if (!evaluate) {
      warn('getTypeKeys: condition support needs evaluateCondition (import validateType or the runtime index first).', expect);
      return;
    }
    const decision = evaluate(expect.checkType, expect.extendsType, warn);
    if (decision === true) {
      return resolveKeys(expect.trueType, warn, depth + 1);
    }
    if (decision === false) {
      return resolveKeys(expect.falseType, warn, depth + 1);
    }
    return;
  } else if (type === 'mapping') {
    // Materialize through the table (a static import would cycle back here).
    const materialize = validators.materializeMapping;
    if (!materialize) {
      warn('getTypeKeys: mapping support needs createTypeFromMapping (import validateType or the runtime index first).', expect);
      return;
    }
    if (++mappingDepth > 10) {
      mappingDepth--;
      warn('getTypeKeys: exceeded depth, possible circular type.', expect);
      return;
    }
    try {
      const materialized = materialize(expect, warn);
      if (!materialized || !materialized.properties) {
        return;
      }
      return Object.keys(materialized.properties);
    } finally {
      mappingDepth--;
    }
  } else if (type === 'indexedAccess') {
    const {
      index
    } = expect;
    let {
      object
    } = expect;
    // todo replace with resolveType
    if (typeof object === 'string' && typedefs[object]) {
      object = typedefs[object];
    }
    if (object && object.type === 'mapping') {
      // Indexing into a mapped type materializes it first.
      const materialize = validators.materializeMapping;
      if (materialize) {
        object = materialize(object, warn);
      }
    }
    const indexKeys = getTypeKeys(index, warn, depth + 1);
    if (!indexKeys) {
      warn(`Couldn't get keys for index type`, index);
      return;
    }
    const resolved = object && object.type === 'object' ? object : resolveObject(object, warn, depth + 1);
    if (!resolved || !resolved.properties) {
      warn(`Couldn't get keys for type - missing object properties`, expect);
      return;
    }
    const arr = [];
    for (const indexKey of indexKeys) {
      const prop = resolved.properties[stripKey(indexKey)];
      if (prop === undefined) {
        warn(`Property '${indexKey}' does not exist on type`, resolved);
        continue;
      }
      const sub = getTypeKeys(prop, warn, depth + 1);
      if (!sub) {
        continue;
      }
      arr.push(...sub);
    }
    // console.log({object, index, indexKeys, arr});
    return [...new Set(arr)];
  }
  warn(`Couldn't get keys for type`, expect);
}
export {getTypeKeys, instantiateReference, resolveObject, stripKey};
