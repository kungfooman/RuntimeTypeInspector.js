import {typedefs, typedefTemplates} from './registerTypedef.js';
import {replaceType} from './replaceType.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {keyNames, resolveObject, resolveUtilityShape} from './getTypeKeys.js';
import {classes} from './registerClass.js';
import {mergedClassShape} from './classShape.js';
import {recurse, validators} from './validators.js';
import {options} from './options.js';
import './validateType.js';
import './evaluateCondition.js';
import {stringifyType} from './stringifyType.js';
import {previewValue, stringifyValue} from './stringifyValue.js';
import {describeValueType, formatMapKey} from './describeValue.js';
const MAX_DEPTH = 6;
const MAX_UNION_MEMBERS = 12;
const MAX_MAP_ENTRIES = 20;
const noop = () => undefined;
/**
 * Short one-line JSON snapshot of a value for diagnosis rows. `Map`/`Set`
 * read as inferred generics (`Map<string, null>`) instead of raw
 * `{"$type": "Map", …}` snapshots (issue #267).
 * @param {*} value - The value.
 * @returns {string} Truncated snapshot.
 */
function snip(value) {
  try {
    if (value instanceof Map || value instanceof Set) {
      const text = describeValueType(value);
      return text.length > 160 ? `${text.slice(0, 157)}...` : text;
    }
  } catch {
    // Fall through to the JSON snapshot below.
  }
  return previewValue(value, 160);
}
/**
 * Short one-line summary of an expected type, resolved to the concrete
 * shape first so rows read `Array<number>` instead of
 * `MergedComponentOptions<"camera">["clearColor"]`.
 * @param {*} expect - The expected type.
 * @returns {string} Type summary.
 */
function expectSnip(expect) {
  try {
    const flat = stringifyType(materializeExpect(expect));
    return flat.length > 160 ? `${flat.slice(0, 157)}...` : flat;
  } catch {
    return String(expect?.type ?? expect);
  }
}
/**
 * Materializes aliases into concrete shapes without validating: named
 * typedefs, generic references (`ComponentOptions<"camera">` is instantiated
 * like `validateReference` does), mapped types, decided conditions, and
 * indexed access (`T["clearColor"]` selects the property type). Anything
 * else (utility types like `Partial`, undecidable conditions, classes) is
 * returned as-is and treated as an opaque leaf by the differ.
 * @param {*} expect - The expected type.
 * @returns {*} Concrete type, or the input when unresolvable.
 */
function materializeExpect(expect) {
  let current = expect;
  for (let i = 0; i < 10; i++) {
    if (typeof current === 'string') {
      if (typedefs[current]) {
        current = structuredClone(typedefs[current]);
        continue;
      }
      if (classes[current]) {
        let shape;
        try {
          shape = mergedClassShape(current);
        } catch {
          shape = undefined;
        }
        if (shape && shape.properties) {
          current = shape;
          continue;
        }
      }
      return current;
    }
    if (current && typeof current === 'object') {
      if (current.type === 'condition') {
        let decision;
        try {
          decision = validators.evaluateCondition?.(current.checkType, current.extendsType, noop);
        } catch {
          decision = undefined;
        }
        if (decision === true) {
          current = current.trueType;
          continue;
        }
        if (decision === false) {
          current = current.falseType;
          continue;
        }
        return current;
      }
      if (current.type === 'mapping') {
        try {
          const made = createTypeFromMapping(current, noop);
          if (!made) {
            return expect;
          }
          current = made;
          continue;
        } catch {
          return expect;
        }
      }
      if (current.type === 'indexedAccess') {
        let selected;
        try {
          selected = resolveObject(current, noop, 0);
        } catch {
          selected = undefined;
        }
        if (selected === undefined) {
          return current;
        }
        current = selected;
        continue;
      }
      if (current.type === 'reference') {
        const {name, args} = current;
        if ((name === 'Partial' || name === 'Pick' || name === 'Omit' || name === 'Required') && args?.length) {
          let shape;
          try {
            shape = resolveUtilityShape(name, args, noop, 0);
          } catch {
            shape = undefined;
          }
          if (shape !== undefined) {
            current = shape;
            continue;
          }
        }
        if (typedefs[name]) {
          const params = typedefTemplates[name];
          let instance = structuredClone(typedefs[name]);
          if (args?.length && params?.length) {
            params.forEach((param, j) => {
              instance = replaceType(instance, param, j < args.length ? args[j] : 'any', noop);
            });
            current = instance;
            continue;
          }
          current = instance;
          continue;
        }
        return current;
      }
    }
    break;
  }
  return current;
}
/**
 * Silent pass/fail probe using the real validators (current options apply).
 * @param {*} value - The value.
 * @param {*} expect - The expected type.
 * @returns {boolean} True when the value satisfies the type.
 */
function passes(value, expect) {
  try {
    return recurse(value, expect, 'explain', 'value', false, noop, 0);
  } catch {
    return false;
  }
}
/**
 * @param {*} prop - A property type.
 * @returns {boolean} True when the property may be absent.
 */
function isOptionalProp(prop) {
  return !!(prop && typeof prop === 'object' && prop.optional);
}
/**
 * Checks whether an excess key was deliberately excluded upstream (`Omit`)
 * or simply never selected (`Pick`), by walking the unresolved expect tree.
 * Plain objects have no such provenance — those stay typo suspects.
 * @param {*} expect - The unresolved expected type.
 * @param {string} key - The excess key.
 * @param {Array} [seen] - Path guard against registry cycles.
 * @returns {{removed: boolean, source: string}|null} Provenance or null.
 */
function removalInfo(expect, key, seen = []) {
  if (!expect || seen.includes(expect)) {
    return null;
  }
  if (typeof expect === 'string') {
    if (!typedefs[expect]) {
      return null;
    }
    return removalInfo(typedefs[expect], key, [...seen, expect]);
  }
  if (typeof expect !== 'object') {
    return null;
  }
  if (expect.type === 'reference') {
    const {name, args} = expect;
    if ((name === 'NonNullable' || name === 'Readonly' || name === 'NoInfer') && args?.length) {
      return removalInfo(args[0], key, [...seen, expect]);
    }
    if ((name === 'Omit' || name === 'Pick') && args?.length === 2) {
      const names = keyNames(args[1], noop, 0);
      if (!names) {
        return null;
      }
      const listed = names.includes(key);
      // Source label keeps the unresolved spelling (`Omit<…>`), which is
      // the whole point of this message.
      let source;
      try {
        source = stringifyType(expect);
      } catch {
        source = name;
      }
      if (source.length > 80) {
        source = `${source.slice(0, 77)}...`;
      }
      if (name === 'Omit' && listed) {
        return {removed: true, source};
      }
      if (name === 'Pick' && !listed) {
        return {removed: false, source};
      }
      return null;
    }
    if (typedefs[name]) {
      const params = typedefTemplates[name];
      let instance = typedefs[name];
      if (args?.length && params?.length) {
        instance = structuredClone(instance);
        params.forEach((param, j) => {
          instance = replaceType(instance, param, j < args.length ? args[j] : 'any', noop);
        });
      }
      return removalInfo(instance, key, [...seen, expect]);
    }
    return null;
  }
  if (expect.type === 'union' && Array.isArray(expect.members)) {
    for (const member of expect.members) {
      const info = removalInfo(member, key, [...seen, expect]);
      if (info) {
        return info;
      }
    }
  }
  return null;
}
/**
 * One shared wording for excess keys, used by the Diagnosis list and the
 * type tree alike. Provenance (`Omit` removal / `Pick` selection) wins over
 * the typo suspicion; without any, plain objects stay typo suspects.
 * @param {string} subPath - Dotted path, e.g. `payload.id`.
 * @param {string} key - The excess key.
 * @param {string} actual - Actual-value snapshot.
 * @param {string[]} allowed - Declared keys of the shape.
 * @param {{removed: boolean, source: string}|null} info - Provenance or null.
 * @returns {{kind: string, expected: string, detail: string, fix: string}} Finding fields.
 */
function describeExcess(subPath, key, actual, allowed, info) {
  if (info?.removed) {
    return {
      kind: 'extra',
      expected: `(without \`${key}\` per ${info.source})`,
      detail: `\`${key}\` was deliberately removed by ${info.source} — drop it.`,
      fix: `Remove \`${subPath}\`.`,
    };
  }
  if (info) {
    return {
      kind: 'extra',
      expected: `(selected by ${info.source})`,
      detail: `\`${key}\` is not selected by ${info.source} — drop it.`,
      fix: `Remove \`${subPath}\`.`,
    };
  }
  return {
    kind: 'extra',
    expected: `(one of ${allowed.join(', ') || 'nothing'})`,
    detail: `\`${key}\` is not part of the type — check spelling.`,
    fix: `Remove \`${subPath}\` or check spelling against: ${allowed.join(', ') || 'nothing'}.`,
  };
}
/**
 * Structural diff of a `Map` value against a `Map<K, V>` type (issue #267).
 * Every entry value is diffed against `V` with a `.get('key')` path — the
 * same naming `validateMap` warns with — so the Diagnosis pinpoints the
 * failing entry instead of reporting one opaque whole-value mismatch.
 * @param {*} value - The actual value.
 * @param {*} mat - The materialized `{type: 'map', key, val}` type.
 * @param {string} path - Dotted path, e.g. `config`.
 * @param {number} depth - Recursion depth.
 * @returns {object[]} Findings (empty when the value satisfies the type).
 */
function diffMapValue(value, mat, path, depth) {
  let isMap = false;
  try {
    isMap = value instanceof Map;
  } catch {
    isMap = false;
  }
  if (!isMap) {
    return [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: `Expected a Map (${expectSnip(mat)}), got ${snip(value)}.`,
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    }];
  }
  if (mat.key !== 'string') {
    // Mirrors validateMap: only string keys are supported.
    return passes(value, mat) ? [] : [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: 'Value does not satisfy the type.',
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    }];
  }
  if (depth >= MAX_DEPTH) {
    return passes(value, mat) ? [] : [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: 'Nested too deep to break down further.',
    }];
  }
  const findings = [];
  let shown = 0;
  try {
    for (const [key, val] of value) {
      if (shown >= MAX_MAP_ENTRIES) {
        break;
      }
      findings.push(...diffValue(val, mat.val, `${path}.get(${formatMapKey(key)})`, depth + 1));
      shown++;
    }
  } catch {
    return passes(value, mat) ? [] : [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: 'Map entries are unreadable.',
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    }];
  }
  if (!findings.length && !passes(value, mat)) {
    // Entries past the budget fail without an entry pinpoint.
    findings.push({
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: `First ${shown} entries match; the problem is in a later entry.`,
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    });
  }
  return findings;
}
/**
 * Structural diff of a `Set` value against a `Set<T>` type (issue #267).
 * Members are diffed by index (`path[0]`, …), mirroring the object diff.
 * @param {*} value - The actual value.
 * @param {*} mat - The materialized `{type: 'set', elementType}` type.
 * @param {string} path - Dotted path, e.g. `tags`.
 * @param {number} depth - Recursion depth.
 * @returns {object[]} Findings (empty when the value satisfies the type).
 */
function diffSetValue(value, mat, path, depth) {
  let isSet = false;
  try {
    isSet = value instanceof Set;
  } catch {
    isSet = false;
  }
  if (!isSet) {
    return [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: `Expected a Set (${expectSnip(mat)}), got ${snip(value)}.`,
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    }];
  }
  if (depth >= MAX_DEPTH) {
    return passes(value, mat) ? [] : [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: 'Nested too deep to break down further.',
    }];
  }
  const findings = [];
  let i = 0;
  try {
    for (const item of value) {
      if (i >= MAX_MAP_ENTRIES) {
        break;
      }
      findings.push(...diffValue(item, mat.elementType, `${path}[${i}]`, depth + 1));
      i++;
    }
  } catch {
    return passes(value, mat) ? [] : [{
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: 'Set members are unreadable.',
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    }];
  }
  if (!findings.length && !passes(value, mat)) {
    findings.push({
      path,
      kind: 'wrong',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: `First ${i} members match; the problem is in a later member.`,
      fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
    });
  }
  return findings;
}
/**
 * Structural diff producing path-pinned findings. Objects compare key by
 * key (missing required, wrong-typed, unexpected extras); unions probe every
 * member and keep the closest match's findings; anything else is a silent
 * validator probe reported as one leaf finding.
 * @param {*} value - The actual value.
 * @param {*} expect - The expected type.
 * @param {string} path - Dotted path, e.g. `options.clearColor`.
 * @param {number} depth - Recursion depth.
 * @returns {object[]} Findings (empty when the value satisfies the type).
 */
function diffValue(value, expect, path, depth) {
  const mat = materializeExpect(expect);
  if (mat && typeof mat === 'object' && mat.type === 'union' && Array.isArray(mat.members)) {
    const members = mat.members.slice(0, MAX_UNION_MEMBERS);
    let best = null;
    const score = (/** @type {object[]} */ list) => list.length + (list.length === 1 && list[0].kind === 'wrong' && !list[0].children ? 0.5 : 0);
    for (const member of members) {
      const sub = diffValue(value, member, path, depth + 1);
      if (!sub.length) {
        return [];
      }
      if (!best || score(sub) < score(best.findings)) {
        best = {member, findings: sub};
      }
    }
    if (!best) {
      return [];
    }
    return [{
      path,
      kind: 'union',
      expected: expectSnip(mat),
      actual: snip(value),
      detail: `No union member matched; closest is ${expectSnip(best.member)} with ${best.findings.length} problem${best.findings.length === 1 ? '' : 's'}.`,
      children: best.findings,
    }];
  }
  if (mat && typeof mat === 'object' && mat.type === 'map') {
    return diffMapValue(value, mat, path, depth);
  }
  if (mat && typeof mat === 'object' && mat.type === 'set') {
    return diffSetValue(value, mat, path, depth);
  }
  if (mat && typeof mat === 'object' && mat.type === 'object' && mat.properties) {
    if (value === null || typeof value !== 'object') {
      return [{
        path,
        kind: 'not-object',
        expected: expectSnip(mat),
        actual: snip(value),
        detail: `Expected an object with keys ${Object.keys(mat.properties).join(', ') || '(none)'}.`,
      }];
    }
    if (depth >= MAX_DEPTH) {
      return passes(value, mat) ? [] : [{
        path,
        kind: 'wrong',
        expected: expectSnip(mat),
        actual: snip(value),
        detail: 'Nested too deep to break down further.',
      }];
    }
    const findings = [];
    for (const key of Object.keys(mat.properties)) {
      const prop = mat.properties[key];
      const subPath = path ? `${path}.${key}` : key;
      if (!(key in Object(value))) {
        if (!isOptionalProp(prop)) {
          findings.push({
            path: subPath,
            kind: 'missing',
            expected: expectSnip(prop && typeof prop === 'object' && prop.optional ? {...prop, optional: false} : prop),
            actual: '(absent)',
            detail: `Required key \`${subPath}\` is missing.`,
            fix: `Add \`${key}: <${expectSnip(prop)}>\`.`,
          });
        }
        continue;
      }
      // Present: presence already established, so strip the optional wrapper
      // — findings read `'draft' | 'published'`, not `(…)|undefined`.
      const present = prop && typeof prop === 'object' ? {...prop, optional: false} : prop;
      findings.push(...diffValue(value[key], present, subPath, depth + 1));
    }
    for (const key of Object.keys(value)) {
      if (!mat.properties[key]) {
        // Excess keys fail validation only with Exact objects on — but the
        // Diagnosis lists everything known, marking lenient extras as
        // informational instead of dropping them silently.
        const strict = options.exactObjects !== false;
        const subPath = path ? `${path}.${key}` : key;
        const info = mat.__provenance ?? removalInfo(expect, key);
        const rendered = describeExcess(subPath, key, snip(value[key]), Object.keys(mat.properties), info);
        findings.push({
          path: subPath,
          ...rendered,
          detail: strict ? rendered.detail : `${rendered.detail} (informational: passes validation with Exact objects off)`,
          fix: strict ? rendered.fix : undefined,
          info: strict ? undefined : true,
        });
      }
    }
    return findings;
  }
  if (depth > MAX_DEPTH) {
    return passes(value, mat) ? [] : [{
      path, kind: 'wrong', expected: expectSnip(mat), actual: snip(value), detail: 'Value does not satisfy the type.',
    }];
  }
  return passes(value, mat) ? [] : [{
    path,
    kind: 'wrong',
    expected: expectSnip(mat),
    actual: snip(value),
    detail: 'Value does not satisfy the type.',
    fix: `Change \`${path}\` to ${expectSnip(mat)}.`,
  }];
}
/**
 * Explains a failed check: path-pinned findings plus a minimal "make it
 * work" stub built from the missing required keys.
 * @param {*} value - The actual value.
 * @param {*} expect - The expected type.
 * @param {string} rootPath - Argument path, e.g. `options`.
 * @returns {{findings: object[], stub: string}} Diagnosis and fix stub.
 */
function explainMismatch(value, expect, rootPath) {
  const findings = diffValue(value, expect, rootPath || 'value', 0);
  const missing = [];
  const seen = new Set();
  const collect = (list) => {
    for (const finding of list) {
      if (finding.kind === 'missing' && !seen.has(finding.path)) {
        seen.add(finding.path);
        missing.push(finding);
      }
      if (finding.children) {
        collect(finding.children);
      }
    }
  };
  collect(findings);
  const stub = missing.length ?
    `{\n${missing.map((finding) => `  ${finding.path.split('.').pop()}: <${finding.expected}>,`).join('\n')}\n}` :
    '';
  return {findings, stub};
}
export {materializeExpect, diffValue, explainMismatch, expectSnip, snip, describeExcess};
