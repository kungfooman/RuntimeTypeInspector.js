import {variables} from "./registerVariable.js";
import {stripKey} from "./stripKey.js";
import {typedefs, typedefTemplates} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {mergedClassShape} from "./classShape.js";
import {substituteType} from "./substituteType.js";
import {instantiateReference} from "./instantiateReference.js";
import {validators} from "./validators.js";
import {stringifyType} from "./stringifyType.js";
/**
 * Key-resolution split, documented per #256 (consolidation pass deferred):
 * - `resolveKeys(target)` -> string[] names (for `keyof`-style reads; unions
 *   concatenate as a superset approximation, fail-open for validation).
 * - `resolveObject(type)` -> object shape or undefined (narrower than full
 *   materialization; unions/utilities yield undefined, callers fail closed).
 * - `resolveObjectSide(object)` (in createTypeFromIndexedAccess.js) -> property
 *   map for indexed access (chases typedefs, instantiates generics, merges
 *   intersections/unions member-wise, materializes mappings/utilities).
 * A single path would conflate names vs shapes vs merged maps and their
 * distinct fail-open/closed contracts, so the split stays. Depth budgets
 * (25 for names/shapes, 10 for object-side/materialize) reflect that
 * materialization fans out per key and needs the tighter guard.
 */
/** Module-local nesting guard: materialize funnels back through here. */
let mappingDepth = 0;
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
 * @param {*} prop - A property type.
 * @returns {object} Same type marked optional, without mutating the input.
 */
function asOptionalProp(prop) {
  if (prop && typeof prop === 'object') {
    return {...prop, optional: true};
  }
  return {type: prop, optional: true};
}
/**
 * Stamps Omit/Pick provenance onto a materialized shape so renderers know
 * WHY a key is absent (deliberately removed / never selected) instead of
 * guessing typos. Non-enumerable: invisible to `Object.keys`, `JSON` and
 * `structuredClone` consumers. Shapes are freshly built per call, never
 * registry-shared.
 * @param {object} result - Materialized shape or union of shapes.
 * @param {string} name - Omit or Pick.
 * @param {any[]} args - Type arguments (for the source spelling).
 * @returns {object} Same result, tagged.
 */
function tagProvenance(result, name, args) {
  let source;
  try {
    source = stringifyType({type: 'reference', name, args});
    if (source.length > 80) {
      source = `${source.slice(0, 77)}...`;
    }
  } catch {
    source = name;
  }
  const info = {removed: name === 'Omit', source};
  const members = result && result.type === 'union' && Array.isArray(result.members) ? result.members : [result];
  for (const member of members) {
    if (member && typeof member === 'object') {
      Object.defineProperty(member, '__provenance', {value: info, enumerable: false, writable: true, configurable: true});
    }
  }
  return result;
}
/**
 * Resolves Partial/Pick/Omit/Required to concrete shapes, mirroring
 * `validateReference` semantics (homomorphic distribution over unions,
 * shallow optionality changes). Shared by key reads, the explanation
 * differ and the type tree so all three agree.
 * @param {string} name - Partial, Pick, Omit or Required.
 * @param {any[]} args - Type arguments.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {object|undefined} Object shape, union of shapes, or undefined.
 */
function resolveUtilityShape(name, args, warn, depth = 0) {
  if (depth > 10) {
    return;
  }
  const [target, keys] = args ?? [];
  if (target === undefined) {
    return;
  }
  const shapes = [];
  const collect = (type) => {
    if (type && type.type === 'union' && Array.isArray(type.members)) {
      type.members.forEach(collect);
      return;
    }
    const shape = resolveObject(type, warn, depth + 1);
    if (shape && shape.type === 'object' && shape.properties) {
      shapes.push(shape);
    }
  };
  collect(target);
  if (!shapes.length) {
    return;
  }
  if (name === 'Partial') {
    const members = shapes.map((shape) => {
      const properties = {};
      for (const key of Object.keys(shape.properties)) {
        properties[key] = asOptionalProp(shape.properties[key]);
      }
      return {type: 'object', properties};
    });
    return members.length === 1 ? members[0] : {type: 'union', members};
  }
  if (name === 'Required') {
    // Shallow like validation: only top-level optionality is stripped.
    const members = shapes.map((shape) => {
      const properties = {};
      for (const key of Object.keys(shape.properties)) {
        const prop = shape.properties[key];
        properties[key] = prop && typeof prop === 'object' ? {...prop, optional: false} : prop;
      }
      return {type: 'object', properties};
    });
    return members.length === 1 ? members[0] : {type: 'union', members};
  }
  if (keys === undefined) {
    return;
  }
  const names = keyNames(keys, warn, depth + 1);
  if (!names) {
    return;
  }
  const wanted = new Set(names);
  const members = shapes.map((shape) => {
    const properties = {};
    for (const key of Object.keys(shape.properties)) {
      if (wanted.has(key) === (name === 'Pick')) {
        properties[key] = shape.properties[key];
      }
    }
    return {type: 'object', properties};
  });
  const out = members.length === 1 ? members[0] : {type: 'union', members};
  return tagProvenance(out, name, args);
}
/**
 * Resolves a type to an object shape for key reading. Narrower than full
 * materialization: multi-member unions and unresolvable shapes yield
 * undefined. A union of a single object with nullish members (the
 * `NonNullable<Entity[K]>` shape) resolves to that object.
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
  if (type.type === 'union' && Array.isArray(type.members)) {
    // `NonNullable<T>` unwraps above, but a bare indexed access like
    // `Entity["camera"]` can still denote `Camera | undefined`: a single
    // object beside nullish members resolves to that object, anything
    // wider stays unresolvable rather than guessing a member.
    const kept = type.members.filter((member) => member !== 'null' && member !== 'undefined');
    if (kept.length === 1) {
      return resolveObject(kept[0], warn, depth + 1);
    }
    return;
  }
  if (type.type === 'intersection' && Array.isArray(type.members)) {
    // Mirrors resolveObjectSide: merge member shapes, fail closed when any
    // member is unresolvable. Bare `{}` members contribute no keys.
    const properties = {};
    for (const member of type.members) {
      const resolved = resolveObject(member, warn, depth + 1);
      if (!resolved) {
        return;
      }
      Object.assign(properties, resolved.properties ?? {});
    }
    return {type: 'object', properties};
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
    if ((name === 'Partial' || name === 'Pick' || name === 'Omit' || name === 'Required') && args?.length) {
      const shape = resolveUtilityShape(name, args, warn, depth + 1);
      return shape && shape.type === 'object' ? shape : undefined;
    }
    const instance = instantiateReference(type, warn);
    if (instance === undefined) {
      return;
    }
    return resolveObject(instance, warn, depth + 1);
  }
  if (typeof type.type === 'string' && (classes[type.type] || typedefs[type.type])) {
    // Named-type wrappers `{type: Name, optional?, readonly?}` (from
    // `Partial`, harvest, etc.): resolve the name for shape reading; the
    // flags don't affect keys. Placed last so every structural kind keeps
    // its dedicated handling above.
    return resolveObject(type.type, warn, depth + 1);
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
    const result = substituteType(mapping.result, element, `"${key}"`, warn);
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
 * getTypeKeys({type: 'object', properties: {a: 'string', b: 'number'}}, console.warn);
 * // ['a', 'b']
 * // Or simpler:
 * getTypeKeys(expandType('{a: string, b: number}'), console.warn);
 * // ['a', 'b']
 * getTypeKeys(expandType('1|2|3'), console.warn);
 * // [1, 2, 3]
 * // Typedef names resolve through the registry:
 * registerTypedef('Box', expandType('{a: number, b: string}'));
 * getTypeKeys('Box', console.warn);
 * // ['a', 'b']
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
      if (name === 'NonNullable') {
        // `NonNullable<Entity["camera"]>` denotes `CameraComponent`, not the
        // union members: resolve single-object-plus-nullish unions to the
        // object's keys instead of returning member names like
        // `["CameraComponent", "undefined"]`, which would poison downstream
        // `keyof` / `Extract` / `Pick` computations.
        const shape = resolveObject(args[0], warn, depth + 1);
        if (shape && shape.properties) {
          return Object.keys(shape.properties);
        }
      }
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
export {getTypeKeys, resolveObject, resolveUtilityShape, keyNames};
