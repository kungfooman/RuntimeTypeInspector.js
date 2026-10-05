import {typedefs, typedefTemplates} from "./registerTypedef.js";
import {classes} from "./registerClass.js";
import {validators, recurse} from "./validators.js";
import {substituteType} from "./substituteType.js";
import {createTypeFromMapping} from "./createTypeFromMapping.js";
import {createTypeFromIndexedAccess} from "./createTypeFromIndexedAccess.js";
import {mergedClassShape} from "./classShape.js";
import {nominalClassOf} from "./nominalClassOf.js";
import {getTypeKeys, resolveUtilityShape} from "./getTypeKeys.js";
import {instantiateReference} from "./instantiateReference.js";
import {extendsCheck, resolveForExtends, stripLiteral, deepEqualType, evaluateCondition} from "./evaluateCondition.js";
/**
 * Follows strings through typedefs (and materializes mappings) to object
 * shapes, distributing over unions like homomorphic mapped types do.
 * Never mutates the registry: callers build fresh containers.
 * @param {*} type - The type to resolve.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {object[]} Object shapes, empty when unresolvable.
 */
function resolveObjectArgs(type, warn) {
  let current = type;
  for (let i = 0; i < 10; i++) {
    if (typeof current === 'string') {
      if (typedefs[current]) {
        current = typedefs[current];
        continue;
      }
      if (classes[current]) {
        current = mergedClassShape(current);
        continue;
      }
      return [];
    }
    if (current && current.type === 'indexedAccess') {
      const create = validators.createTypeFromIndexedAccess ?? createTypeFromIndexedAccess;
      const resolved = create ? create(current, () => undefined) : undefined;
      if (resolved === undefined) {
        return [];
      }
      current = resolved;
      continue;
    }
    if (current && current.type === 'mapping') {
      current = createTypeFromMapping(current, warn);
      continue;
    }
    if (current && current.type === 'intersection' && Array.isArray(current.members)) {
      // Intersections merge member shapes (mirroring resolveObject): every
      // member must resolve to exactly one shape, otherwise fail closed
      // exactly like an unresolvable base did before.
      const merged = {};
      const signatures = [];
      let ok = true;
      for (const member of current.members) {
        const found = resolveObjectArgs(member, warn);
        if (found.length !== 1) {
          ok = false;
          break;
        }
        Object.assign(merged, found[0].properties ?? {});
        if (Array.isArray(found[0].indexSignatures)) {
          signatures.push(...found[0].indexSignatures);
        }
      }
      if (!ok) {
        return [];
      }
      current = signatures.length ? {type: 'object', properties: merged, indexSignatures: signatures} : {type: 'object', properties: merged};
      continue;
    }
    if (current && current.type === 'reference') {
      const {name, args} = current;
      if ((name === 'NonNullable' || name === 'Readonly' || name === 'NoInfer') && args?.length) {
        current = args[0];
        continue;
      }
      if ((name === 'Partial' || name === 'Pick' || name === 'Omit' || name === 'Required') && args?.length) {
        // Nested utilities (e.g. `Partial<Pick<...>>` inside
        // `ComponentOptionsOf`): materialize to shapes, then fall through
        // to the union/object handling below so homomorphic distribution
        // over unions is preserved.
        current = resolveUtilityShape(name, args, warn);
        break;
      }
      if (typedefs[name]) {
        const instance = instantiateReference(current, warn);
        if (!instance || instance === current) {
          return [];
        }
        current = instance;
        continue;
      }
      return [];
    }
    break;
  }
  if (current && current.type === 'union' && Array.isArray(current.members)) {
    return current.members.flatMap((member) => resolveObjectArgs(member, warn));
  }
  if (current && current.type === 'object' && (current.properties || current.indexSignatures)) {
    return [current];
  }
  return [];
}
/**
 * @param {*} prop - A property type.
 * @returns {object} Same type marked optional, without mutating the input.
 */
function asOptional(prop) {
  if (prop && typeof prop === 'object') {
    return {...prop, optional: true};
  }
  return {type: prop, optional: true};
}
/**
 * Applies an intrinsic string mapping to literal text.
 * @param {string} name - One of Uppercase/Lowercase/Capitalize/Uncapitalize.
 * @param {string} text - Literal text.
 * @returns {string} Mapped text.
 */
function applyStringIntrinsic(name, text) {
  switch (name) {
    case 'Uppercase':
      return text.toUpperCase();
    case 'Lowercase':
      return text.toLowerCase();
    case 'Capitalize':
      return text.length ? text[0].toUpperCase() + text.slice(1) : text;
    default:
      return text.length ? text[0].toLowerCase() + text.slice(1) : text;
  }
}
/**
 * Checks a broad string against an intrinsic mapping.
 * @param {string} name - One of Uppercase/Lowercase/Capitalize/Uncapitalize.
 * @param {string} value - The value.
 * @returns {boolean} True when the value already satisfies the mapping.
 */
function checkStringIntrinsic(name, value) {
  switch (name) {
    case 'Uppercase':
      return value === value.toUpperCase();
    case 'Lowercase':
      return value === value.toLowerCase();
    case 'Capitalize':
      return !value.length || value[0] === value[0].toUpperCase();
    default:
      return !value.length || value[0] === value[0].toLowerCase();
  }
}
/**
 * Reads a key list from a union of literals (or anything getTypeKeys handles).
 * @param {*} keyType - The key type.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {string[]|undefined} Stripped key names or undefined.
 */
function keyList(keyType, warn) {
  if (keyType && keyType.type === 'union' && Array.isArray(keyType.members)) {
    return keyType.members.map((member) => (typeof member === 'string' ? stripLiteral(member) : member)).filter((key) => typeof key === 'string');
  }
  const keys = getTypeKeys(keyType, warn);
  if (Array.isArray(keys)) {
    return keys.map((key) => (typeof key === 'string' ? stripLiteral(key) : key)).filter((key) => typeof key === 'string');
  }
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} elementType - The element type each indexed entry must satisfy.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {import('./validateType.js').TypeObject} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateReference(value, expect, loc, name, critical, warn, depth) {
  const {name: refName, args} = expect;
  const firstArg = args?.[0];
  switch (refName) {
    case 'ArrayLike':
    case 'NodeListOf':
    case 'HTMLCollectionOf':
    case 'NodeList':
    case 'HTMLCollection':
      // Bare `ArrayLike` / DOM list types without <T>: shape-only check
      // (the validator defaults a missing argument to `any`).
      return validators.validateArrayLike(value, expect, loc, name, critical, warn, depth + 1);
    case 'ReadonlyArray':
      // Readonly-ness is erased at runtime, same shape as Array.
      if (!firstArg) {
        warn('ReadonlyArray requires one type argument.', {expect});
        return false;
      }
      return validators.validateArray(value, {type: 'array', elementType: firstArg}, loc, name, critical, warn, depth + 1);
    case 'ConcatArray':
      // ConcatArray<T> is array-like (length + indexed access) plus join/slice.
      // Accept anything array-like here; arrays trivially satisfy it.
      if (!firstArg) {
        warn('ConcatArray requires one type argument.', {expect});
        return false;
      }
      return validators.validateArrayLike(value, expect, loc, name, critical, warn, depth + 1);
    case 'Readonly':
      // Readonly<T> doesn't change the runtime shape.
      if (!firstArg) {
        warn('Readonly requires one type argument.', {expect});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'NonNullable':
      if (!firstArg) {
        warn('NonNullable requires one type argument.', {expect});
        return false;
      }
      if (value === null || value === undefined) {
        warn('Expected NonNullable, got null/undefined.', {value});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    case 'Partial': {
      if (!firstArg) {
        warn('Partial requires one type argument.', {expect});
        return false;
      }
      // Nominal classes accept their instances (including subclasses)
      // outright: a genuine instance already carries every member, so it
      // satisfies the partial just like it satisfies the bare class check.
      // Plain objects still validate structurally below, keeping mistyped
      // props loud.
      const partialNominal = nominalClassOf(firstArg);
      if (partialNominal && value instanceof partialNominal) {
        return true;
      }
      // Homomorphic distribution: `Partial<A | B>` validates each member
      // through `Partial` again so primitives survive alongside objects.
      if (firstArg && firstArg.type === 'union' && Array.isArray(firstArg.members)) {
        const members = firstArg.members.map((member) => ({type: 'reference', name: 'Partial', args: [member]}));
        return recurse(value, {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      // `Partial<GizmoTheme[K]>` resolves the indexed access first, then
      // re-applies `Partial` so primitives pass through and objects turn optional.
      if (firstArg && firstArg.type === 'indexedAccess') {
        const create = validators.createTypeFromIndexedAccess ?? createTypeFromIndexedAccess;
        const resolved = create ? create(firstArg, () => undefined) : undefined;
        if (resolved !== undefined) {
          return recurse(value, {type: 'reference', name: 'Partial', args: [resolved]}, loc, name, critical, warn, depth + 1);
        }
      }
      // Transparent wrappers keep homomorphic behavior through recursion.
      if (firstArg && firstArg.type === 'reference' && firstArg.args?.length &&
        (firstArg.name === 'NonNullable' || firstArg.name === 'Readonly' || firstArg.name === 'NoInfer')) {
        return recurse(value, {type: 'reference', name: 'Partial', args: [firstArg.args[0]]}, loc, name, critical, warn, depth + 1);
      }
      // Typedef aliases to primitives (e.g. `type Id = number`) recurse so
      // the underlying primitive takes the passthrough below.
      if (typeof firstArg === 'string' && typedefs[firstArg]) {
        const aliased = typedefs[firstArg];
        if (typeof aliased === 'string' && !typedefs[aliased] && !classes[aliased]) {
          return recurse(value, aliased, loc, name, critical, warn, depth + 1);
        }
      }
      if (firstArg && firstArg.type === 'reference' && typedefs[firstArg.name]) {
        const instance = instantiateReference(firstArg, warn);
        if (typeof instance === 'string' && !typedefs[instance] && !classes[instance]) {
          return recurse(value, instance, loc, name, critical, warn, depth + 1);
        }
      }
      const objects = resolveObjectArgs(firstArg, warn);
      if (objects.length) {
        const members = objects.map((object) => {
          const properties = {};
          for (const key of Object.keys(object.properties ?? {})) {
            properties[key] = asOptional(object.properties[key]);
          }
          // Index signatures carry over untouched: validation reads them
          // off the shape exactly like it does for the unmapped base.
          const out = {type: 'object', properties};
          if (Array.isArray(object.indexSignatures)) {
            out.indexSignatures = object.indexSignatures;
          }
          return out;
        });
        return recurse(value, members.length === 1 ? members[0] : {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      // Homomorphic passthrough: `Partial<number>` is `number` (and the same
      // for other primitives and literals), matching TypeScript.
      if (typeof firstArg === 'string') {
        if (!typedefs[firstArg] && !classes[firstArg]) {
          const primitives = new Set(['any', 'unknown', 'never', 'null', 'undefined', 'void',
            'string', 'number', 'boolean', 'bigint', 'symbol', 'Function', 'CallableFunction',
            'NewableFunction', 'function', 'new', 'ObjectConstructor', 'IArguments', 'ArrayBufferView']);
          const isQuoted = firstArg.length >= 2 &&
            ((firstArg[0] === '"' && firstArg[firstArg.length - 1] === '"') ||
             (firstArg[0] === "'" && firstArg[firstArg.length - 1] === "'"));
          if (primitives.has(firstArg) || isQuoted) {
            return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
          }
        }
      }
      if (typeof firstArg === 'number' || typeof firstArg === 'boolean') {
        return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      // Functions collapse to `{}`: TypeScript reduces homomorphic mappings
      // over bare signatures to an all-optional method bag, which admits
      // every non-nullish value (and rejects nullish ones) — exactly what
      // the bare object check below enforces.
      if (firstArg && (firstArg.type === 'function' || firstArg.type === 'new')) {
        return recurse(value, {type: 'object'}, loc, name, critical, warn, depth + 1);
      }
      // `Partial<string[]>` is `(string | undefined)[]`: arrays stay arrays
      // with optional elements instead of rejecting every array outright.
      if (firstArg && firstArg.type === 'array') {
        const element = firstArg.elementType;
        const hasUndefined = element === 'undefined' ||
          (element && element.type === 'union' && Array.isArray(element.members) && element.members.includes('undefined'));
        const partialElement = hasUndefined ? element : {type: 'union', members: [element, 'undefined']};
        return recurse(value, {...firstArg, type: 'array', elementType: partialElement}, loc, name, critical, warn, depth + 1);
      }
      // `Partial<[number, string]>` is `[(number | undefined)?, (string |
      // undefined)?]`: tuples stay tuples with optional undefined-able
      // members instead of rejecting every tuple outright.
      if (firstArg && firstArg.type === 'tuple' && Array.isArray(firstArg.elements)) {
        const elements = firstArg.elements.map((element) => {
          if (element && element.type === 'rest') {
            return element;
          }
          const inner = element && element.type === 'tupleMember' ? element.elementType : element;
          const hasUndefined = inner === 'undefined' ||
            (inner && inner.type === 'union' && Array.isArray(inner.members) && inner.members.includes('undefined'));
          const elementType = hasUndefined ? inner : {type: 'union', members: [inner, 'undefined']};
          if (element && element.type === 'tupleMember') {
            return {...element, elementType, optional: true};
          }
          return {type: 'tupleMember', elementType, optional: true};
        });
        return recurse(value, {...firstArg, type: 'tuple', elements}, loc, name, critical, warn, depth + 1);
      }
      // Decidable conditions resolve to a branch first: `Partial<Cond>` is
      // `Partial<TrueBranch>` (or false). Typedef aliases (and generic
      // instantiations) are chased until the condition shows. Undecidable
      // ones stay failed closed exactly like unresolvable bases did before.
      if (firstArg !== undefined) {
        let target = firstArg;
        for (let i = 0; i < 10; i++) {
          if (typeof target === 'string' && typedefs[target]) {
            target = typedefs[target];
            continue;
          }
          if (target && target.type === 'reference' && typedefs[target.name]) {
            const instance = instantiateReference(target, warn);
            if (!instance || instance === target) {
              break;
            }
            target = instance;
            continue;
          }
          break;
        }
        if (target && target.type === 'condition') {
          const decision = evaluateCondition(target.checkType, target.extendsType, warn);
          if (decision === true) {
            return recurse(value, {type: 'reference', name: 'Partial', args: [target.trueType]}, loc, name, critical, warn, depth + 1);
          }
          if (decision === false) {
            return recurse(value, {type: 'reference', name: 'Partial', args: [target.falseType]}, loc, name, critical, warn, depth + 1);
          }
        }
      }
      // `Partial<Record<string, number>>` is `Record<string, number |
      // undefined>`: records stay records with optional values.
      if (firstArg && firstArg.type === 'record') {
        const val = firstArg.val;
        const hasUndefined = val === 'undefined' ||
          (val && val.type === 'union' && Array.isArray(val.members) && val.members.includes('undefined'));
        const partialVal = hasUndefined ? val : {type: 'union', members: [val, 'undefined']};
        return recurse(value, {...firstArg, val: partialVal}, loc, name, critical, warn, depth + 1);
      }
      warn('Partial requires an object type argument.', {expect});
      return false;
    }
    case 'Pick':
    case 'Omit': {
      const [target, keys] = args ?? [];
      if (!target || keys === undefined) {
        warn(`${refName} requires two type arguments.`, {expect});
        return false;
      }
      // Class instances satisfy any Pick/Omit of their class structurally
      // in tsc (extra members are fine for non-fresh values), and RTI
      // agrees with the bare class check — so accept them nominally here
      // too instead of tripping the excess check on sibling members.
      const pickNominal = nominalClassOf(target);
      if (pickNominal && value instanceof pickNominal) {
        return true;
      }
      const objects = resolveObjectArgs(target, warn);
      const names = keyList(keys, warn);
      if (!objects.length || !names) {
        warn(`${refName} requires an object and key names.`, {expect});
        return false;
      }
      const wanted = new Set(names);
      const members = objects.map((object) => {
        const properties = {};
        for (const key of Object.keys(object.properties ?? {})) {
          if (wanted.has(key) === (refName === 'Pick')) {
            properties[key] = object.properties[key];
          }
        }
        const out = {type: 'object', properties};
        if (Array.isArray(object.indexSignatures)) {
          out.indexSignatures = object.indexSignatures;
        }
        return out;
      });
      return recurse(value, members.length === 1 ? members[0] : {type: 'union', members}, loc, name, critical, warn, depth + 1);
    }
    case 'IfEquals': {
      // Identity comparison for WritableKeys-style filtering. Missing A/B
      // fall back to the TypeScript defaults (A=X, B=never).
      const [X, Y, A, B] = args ?? [];
      if (X === undefined || Y === undefined) {
        warn('IfEquals requires two type arguments.', {expect});
        return false;
      }
      const decide = validators.decideIfEquals;
      const decision = decide ? decide(X, Y, warn) : undefined;
      if (decision === true) {
        return recurse(value, A ?? X, loc, name, critical, warn, depth + 1);
      }
      if (decision === false) {
        return recurse(value, B ?? 'never', loc, name, critical, warn, depth + 1);
      }
      warn('IfEquals: undecidable comparison, failing closed.', {expect});
      return false;
    }
    case 'Extract': {
      const [from, to] = args ?? [];
      if (from === undefined || to === undefined) {
        warn('Extract requires two type arguments.', {expect});
        return false;
      }
      const resolvedTo = resolveForExtends(to, warn);
      // Distribute over named unions too: resolve first, then filter members.
      const resolvedFrom = resolveForExtends(from, warn) ?? from;
      const members = resolvedFrom && resolvedFrom.type === 'union' && Array.isArray(resolvedFrom.members) ? resolvedFrom.members : [resolvedFrom];
      const kept = members.filter((member) => extendsCheck(resolveForExtends(member, warn), resolvedTo, warn) !== false);
      if (!kept.length) {
        warn('Extract kept no members.', {expect});
        return false;
      }
      if (kept.length === 1) {
        return recurse(value, kept[0], loc, name, critical, warn, depth + 1);
      }
      return recurse(value, {type: 'union', members: kept}, loc, name, critical, warn, depth + 1);
    }
    case 'Exclude': {
      const [from, to] = args ?? [];
      if (from === undefined || to === undefined) {
        warn('Exclude requires two type arguments.', {expect});
        return false;
      }
      const resolvedTo = resolveForExtends(to, warn);
      const resolvedFrom = resolveForExtends(from, warn) ?? from;
      const members = resolvedFrom && resolvedFrom.type === 'union' && Array.isArray(resolvedFrom.members) ? resolvedFrom.members : [resolvedFrom];
      const kept = members.filter((member) => extendsCheck(resolveForExtends(member, warn), resolvedTo, warn) !== true);
      if (!kept.length) {
        warn('Exclude kept no members.', {expect});
        return false;
      }
      if (kept.length === 1) {
        return recurse(value, kept[0], loc, name, critical, warn, depth + 1);
      }
      return recurse(value, {type: 'union', members: kept}, loc, name, critical, warn, depth + 1);
    }
    case 'Required': {
      if (!firstArg) {
        warn('Required requires one type argument.', {expect});
        return false;
      }
      // Same nominal shortcut as Partial: instances already carry every
      // member the bare class check demands.
      const requiredNominal = nominalClassOf(firstArg);
      if (requiredNominal && value instanceof requiredNominal) {
        return true;
      }
      // Homomorphic like Partial: distribute over unions and resolve indexed
      // access first so `Required<Box | number>` keeps the primitive.
      if (firstArg && firstArg.type === 'union' && Array.isArray(firstArg.members)) {
        const members = firstArg.members.map((member) => ({type: 'reference', name: 'Required', args: [member]}));
        return recurse(value, {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      if (firstArg && firstArg.type === 'indexedAccess') {
        const create = validators.createTypeFromIndexedAccess ?? createTypeFromIndexedAccess;
        const resolved = create ? create(firstArg, () => undefined) : undefined;
        if (resolved !== undefined) {
          return recurse(value, {type: 'reference', name: 'Required', args: [resolved]}, loc, name, critical, warn, depth + 1);
        }
      }
      if (firstArg && firstArg.type === 'reference' && firstArg.args?.length &&
        (firstArg.name === 'NonNullable' || firstArg.name === 'Readonly' || firstArg.name === 'NoInfer')) {
        return recurse(value, {type: 'reference', name: 'Required', args: [firstArg.args[0]]}, loc, name, critical, warn, depth + 1);
      }
      if (typeof firstArg === 'string' && typedefs[firstArg]) {
        const aliased = typedefs[firstArg];
        if (typeof aliased === 'string' && !typedefs[aliased] && !classes[aliased]) {
          return recurse(value, aliased, loc, name, critical, warn, depth + 1);
        }
      }
      if (firstArg && firstArg.type === 'reference' && typedefs[firstArg.name]) {
        const instance = instantiateReference(firstArg, warn);
        if (typeof instance === 'string' && !typedefs[instance] && !classes[instance]) {
          return recurse(value, instance, loc, name, critical, warn, depth + 1);
        }
      }
      const objects = resolveObjectArgs(firstArg, warn);
      if (objects.length) {
        // Required is shallow: only top-level optionality is stripped.
        const members = objects.map((object) => {
          const properties = {};
          for (const key of Object.keys(object.properties ?? {})) {
            const prop = object.properties[key];
            properties[key] = prop && typeof prop === 'object' ? {...prop, optional: false} : prop;
          }
          const out = {type: 'object', properties};
          if (Array.isArray(object.indexSignatures)) {
            out.indexSignatures = object.indexSignatures;
          }
          return out;
        });
        return recurse(value, members.length === 1 ? members[0] : {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      // `Required<number>` is `number`, mirroring Partial passthrough.
      if (typeof firstArg === 'string') {
        if (!typedefs[firstArg] && !classes[firstArg]) {
          const primitives = new Set(['any', 'unknown', 'never', 'null', 'undefined', 'void',
            'string', 'number', 'boolean', 'bigint', 'symbol', 'Function', 'CallableFunction',
            'NewableFunction', 'function', 'new', 'ObjectConstructor', 'IArguments', 'ArrayBufferView']);
          const isQuoted = firstArg.length >= 2 &&
            ((firstArg[0] === '"' && firstArg[firstArg.length - 1] === '"') ||
             (firstArg[0] === "'" && firstArg[firstArg.length - 1] === "'"));
          if (primitives.has(firstArg) || isQuoted) {
            return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
          }
        }
      }
      if (typeof firstArg === 'number' || typeof firstArg === 'boolean') {
        return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      // Functions and arrays pass through like primitives do; Required only
      // strips object optionality, which neither of them carries. Bare
      // signatures collapse to `{}` just like under Partial (see above).
      if (firstArg && (firstArg.type === 'function' || firstArg.type === 'new')) {
        return recurse(value, {type: 'object'}, loc, name, critical, warn, depth + 1);
      }
      if (firstArg && firstArg.type === 'array') {
        return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      // `Required` strips tuple member optionality but keeps element types
      // (including `| undefined`) exactly like it keeps property types.
      if (firstArg && firstArg.type === 'tuple' && Array.isArray(firstArg.elements)) {
        const elements = firstArg.elements.map((element) => {
          if (element && element.type === 'tupleMember') {
            return {...element, optional: false};
          }
          return element;
        });
        return recurse(value, {...firstArg, type: 'tuple', elements}, loc, name, critical, warn, depth + 1);
      }
      // Decidable conditions resolve to a branch first, mirroring Partial.
      if (firstArg !== undefined) {
        let target = firstArg;
        for (let i = 0; i < 10; i++) {
          if (typeof target === 'string' && typedefs[target]) {
            target = typedefs[target];
            continue;
          }
          if (target && target.type === 'reference' && typedefs[target.name]) {
            const instance = instantiateReference(target, warn);
            if (!instance || instance === target) {
              break;
            }
            target = instance;
            continue;
          }
          break;
        }
        if (target && target.type === 'condition') {
          const decision = evaluateCondition(target.checkType, target.extendsType, warn);
          if (decision === true) {
            return recurse(value, {type: 'reference', name: 'Required', args: [target.trueType]}, loc, name, critical, warn, depth + 1);
          }
          if (decision === false) {
            return recurse(value, {type: 'reference', name: 'Required', args: [target.falseType]}, loc, name, critical, warn, depth + 1);
          }
        }
      }
      // `Required` keeps record values exactly (it never strips undefined).
      if (firstArg && firstArg.type === 'record') {
        return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
      }
      warn('Required requires an object type argument.', {expect});
      return false;
    }
    case 'Awaited': {
      if (!firstArg) {
        warn('Awaited requires one type argument.', {expect});
        return false;
      }
      let inner = firstArg;
      for (let i = 0; i < 10 && inner && inner.type === 'promise'; i++) {
        inner = inner.elementType;
      }
      if (inner !== firstArg) {
        // Was (possibly nested) Promise: resolved values are unobservable
        // synchronously, so only the instanceof check applies.
        return recurse(value, {type: 'promise', elementType: inner}, loc, name, critical, warn, depth + 1);
      }
      return recurse(value, inner, loc, name, critical, warn, depth + 1);
    }
    case 'NoInfer': {
      // Blocks inference in TypeScript; the runtime shape is unchanged.
      if (!firstArg) {
        warn('NoInfer requires one type argument.', {expect});
        return false;
      }
      return recurse(value, firstArg, loc, name, critical, warn, depth + 1);
    }
    case 'Uppercase':
    case 'Lowercase':
    case 'Capitalize':
    case 'Uncapitalize': {
      if (firstArg === undefined) {
        warn(`${refName} requires one type argument.`, {expect});
        return false;
      }
      const resolved = resolveForExtends(firstArg, warn) ?? firstArg;
      if (resolved && resolved.type === 'union' && Array.isArray(resolved.members)) {
        // Intrinsics distribute over unions, like TypeScript does.
        const members = [];
        for (const member of resolved.members) {
          if (typeof member !== 'string' || stripLiteral(member) === member) {
            warn(`${refName} needs string literals or string.`, {expect});
            return false;
          }
          members.push(`"${applyStringIntrinsic(refName, stripLiteral(member))}"`);
        }
        return recurse(value, {type: 'union', members}, loc, name, critical, warn, depth + 1);
      }
      if (typeof resolved === 'string') {
        const stripped = stripLiteral(resolved);
        if (stripped !== resolved) {
          const expected = applyStringIntrinsic(refName, stripped);
          if (value !== expected) {
            warn(`Expected ${expected}.`, {value, expect});
          }
          return value === expected;
        }
        if (resolved === 'string') {
          if (typeof value !== 'string' || !checkStringIntrinsic(refName, value)) {
            warn(`Expected ${refName}<string>.`, {value, expect});
            return false;
          }
          return true;
        }
      }
      warn(`${refName} needs a string literal or string argument.`, {expect});
      return false;
    }
    case 'Iterable':
    case 'IterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.iterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.iterator].`, {value});
        return false;
      }
      if (firstArg && value instanceof Array) {
        return validators.validateArrayLike(value, expect, loc, name, critical, warn, depth + 1);
      }
      return true;
    case 'AsyncIterable':
    case 'AsyncIterableIterator':
      if (value === null || value === undefined) {
        warn(`Expected ${refName}, got ${value}.`, {value});
        return false;
      }
      if (typeof value[Symbol.asyncIterator] !== 'function') {
        warn(`Expected ${refName} with [Symbol.asyncIterator].`, {value});
        return false;
      }
      return true;
  }
  if (typedefs[refName] && !classes[refName]) {
    const params = typedefTemplates[refName];
    if (args?.length && params?.length) {
      // Generic typedef: instantiate by substituting arguments for parameters.
      let instance = structuredClone(typedefs[refName]);
      params.forEach((param, i) => {
        instance = substituteType(instance, param, i < args.length ? args[i] : 'any', warn);
      });
      return recurse(value, instance, loc, name, critical, warn, depth + 1);
    }
    if (args?.length) {
      warn(`Generic typedef '${refName}' with type arguments isn't supported yet, validating against raw typedef.`, {expect});
    }
    return recurse(value, typedefs[refName], loc, name, critical, warn, depth + 1);
  }
  if (classes[refName]) {
    return value instanceof classes[refName];
  }
  if (value && value.constructor && value.constructor.name === refName) {
    return true;
  }
  if (typeof globalThis !== 'undefined') {
    const globalClass = globalThis[refName];
    if (globalClass && value instanceof globalClass) {
      return true;
    }
  }
  warn('unchecked', {value, type: 'reference', loc, name, expect});
  return false;
}
export {validateReference};
