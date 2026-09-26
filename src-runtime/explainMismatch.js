import {typedefs, typedefTemplates} from './registerTypedef.js';
import {replaceType} from './replaceType.js';
import {createTypeFromMapping} from './createTypeFromMapping.js';
import {recurse} from './validators.js';
import './validateType.js';
import {stringifyType} from './stringifyType.js';
import {stringifyValue} from './stringifyValue.js';
const MAX_DEPTH = 6;
const MAX_UNION_MEMBERS = 12;
const noop = () => undefined;
/**
 * Short one-line JSON snapshot of a value for diagnosis rows.
 * @param {*} value - The value.
 * @returns {string} Truncated snapshot.
 */
function snip(value) {
  let text;
  try {
    text = JSON.stringify(stringifyValue(value)) ?? String(value);
  } catch {
    text = String(value?.toString?.() ?? value);
  }
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}
/**
 * Short one-line summary of an expected type.
 * @param {*} expect - The expected type.
 * @returns {string} Type summary.
 */
function expectSnip(expect) {
  try {
    const flat = stringifyType(expect);
    return flat.length > 160 ? `${flat.slice(0, 157)}...` : flat;
  } catch {
    return String(expect?.type ?? expect);
  }
}
/**
 * Materializes aliases into concrete shapes without validating: named
 * typedefs, generic references (`ComponentOptions<"camera">` is instantiated
 * like `validateReference` does) and mapped types. Anything else (utility
 * types like `Partial`, conditions, classes) is returned as-is and treated
 * as an opaque leaf by the differ.
 * @param {*} expect - The expected type.
 * @returns {*} Concrete type, or the input when unresolvable.
 */
function materializeExpect(expect) {
  let current = expect;
  for (let i = 0; i < 10; i++) {
    if (typeof current === 'string') {
      if (!typedefs[current]) {
        return current;
      }
      current = structuredClone(typedefs[current]);
      continue;
    }
    if (current && typeof current === 'object') {
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
      if (current.type === 'reference') {
        const {name, args} = current;
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
    for (const member of members) {
      const sub = diffValue(value, member, path, depth + 1);
      if (!sub.length) {
        return [];
      }
      if (!best || sub.length < best.findings.length) {
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
      findings.push(...diffValue(value[key], prop, subPath, depth + 1));
    }
    for (const key of Object.keys(value)) {
      if (!mat.properties[key]) {
        findings.push({
          path: path ? `${path}.${key}` : key,
          kind: 'extra',
          expected: `(one of ${Object.keys(mat.properties).join(', ') || 'nothing'})`,
          actual: snip(value[key]),
          detail: `\`${key}\` is not part of the type — check spelling.`,
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
export {materializeExpect, diffValue, explainMismatch, expectSnip, snip};
