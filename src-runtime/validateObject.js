import {recurse} from "./validators.js";
import {options} from "./options.js";
import {isFresh, isToleratedSpreadKey} from "./freshObjects.js";
import {hasNoCommonKeys    } from "./hasNoCommonKeys.js";
import {isObject           } from "./isObject.js";
import {matchIndexSignature} from "./matchIndexSignature.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateObject(value, expect, loc, name, critical, warn, depth) {
  // Object nodes only: a bare properties bag means a stale direct call
  // under the old contract — fail loudly instead of misreading it.
  if (!expect || expect.type !== 'object') {
    warn('unchecked', {
      value,
      type: 'object',
      loc,
      name,
      expect,
    });
    return false;
  }
  const {properties} = expect;
  if (properties === undefined && !expect.indexSignatures) {
    // Bare `{}`/`object`: accepts every non-nullish value, like TS
    // (`1 extends {}`). Nullish values fall into the guard below for
    // its diagnostic instead of passing silently.
    if (value !== null && value !== undefined) {
      return true;
    }
  }
  if (!isObject(value)) {
    warn('Given value is not an object.');
    return false;
  }
  if (properties && Object.keys(properties).length) {
    if (loc !== 'sortPriority' && loc !== 'getResource' && loc !== 'cmpPriority') {
      const fresh = isFresh(value);
      // Weak-type gate (`tsc --strict` TS2559): a non-empty value with no
      // key in common with an all-optional shape fails at any freshness.
      // Fresh literals usually fail on excess below, but spread-carried
      // keys are tolerated there, so the gate must also run for fresh
      // values: `takeP({...unknown})` shares no key and fails in tsc too.
      if (hasNoCommonKeys(value, expect)) {
        warn(`Given value has no properties in common with type.`, {properties, value});
        return false;
      }
      let failed = false;
      let bare = false;
      Object.keys(value).forEach((key) => {
        if (key === 'profilerHint') {
          return;
        }
        if (!properties[key]) {
          // Keys covered by an index signature validate against its value
          // type instead of counting as excess.
          const signature = matchIndexSignature(expect, key);
          if (signature) {
            const leafDepth = depth + 1;
            const leafOk = recurse(
              value[key],
              signature.indexType,
              loc,
              `${name}.${key}`,
              critical,
              warn,
              leafDepth,
            );
            if (!leafOk) {
              warn(
                `Element ${name}.${key} has wrong type.`,
                {
                  expect: signature.indexType,
                  value: value[key],
                },
              );
              failed = true;
            }
            return;
          }
          // Excess fails only on fresh literals; stale values pass
          // structurally like tsc. Omit/Pick provenance only changes the
          // explanation wording downstream, never the verdict: `tsc`
          // accepts `{a: 1}` against `Omit<Partial<TwBox|TwBox2>, "a">`
          // at any freshness (verified `--strict`), so RTI must too.
          // Spread keys never count: `tsc` forgives every key arriving
          // through `...spread`, so only literally written keys fail.
          if (fresh && !isToleratedSpreadKey(value, key)) {
            const excess = `Excess property '${name}.${key}' is not allowed`;
            warn(`${excess} (fresh object literal).`, {properties, value});
            bare = true;
          } else if (options.logSuperfluousProperty) {
            warn(`Superfluous property: ${name}.${key}`, {properties, value});
          }
        }
      });
      if (failed) {
        return false;
      }
      if (fresh && bare) {
        return false;
      }
    }
  } else if (Array.isArray(expect.indexSignatures) && expect.indexSignatures.length) {
    // No named properties (e.g. a pure `{[n: number]: string}` shape):
    // signature-covered keys validate, uncovered ones count as excess
    // exactly like above.
    if (loc !== 'sortPriority' && loc !== 'getResource' && loc !== 'cmpPriority') {
      const fresh = isFresh(value);
      let failed = false;
      let bare = false;
      for (const key of Object.keys(value)) {
        if (key === 'profilerHint') {
          continue;
        }
        const signature = matchIndexSignature(expect, key);
        if (!signature) {
          if (fresh && !isToleratedSpreadKey(value, key)) {
            const excess = `Excess property '${name}.${key}' is not allowed`;
            warn(`${excess} (fresh object literal).`, {properties, value});
            bare = true;
          } else if (options.logSuperfluousProperty) {
            warn(`Superfluous property: ${name}.${key}`, {properties, value});
          }
          continue;
        }
        const leafDepth = depth + 1;
        const leafOk = recurse(
          value[key],
          signature.indexType,
          loc,
          `${name}.${key}`,
          critical,
          warn,
          leafDepth,
        );
        if (!leafOk) {
          warn(
            `Element ${name}.${key} has wrong type.`,
            {
              expect: signature.indexType,
              value: value[key],
            },
          );
          failed = true;
        }
      }
      if (failed) {
        return false;
      }
      if (fresh && bare) {
        return false;
      }
    }
  }
  for (const key of Object.keys(properties ?? {})) {
    const innerValue = value[key];
    const innerType = properties[key];
    const nameKey = `${name}.${key}`;
    const ret = recurse(innerValue, innerType, loc, nameKey, critical, warn, depth + 1);
    if (!ret) {
      const info = {
        expect: innerType,
        value: innerValue,
      };
      warn(`Element ${nameKey} has wrong type.`, info);
      return false;
    }
  }
  return true;
}
export {validateObject};
