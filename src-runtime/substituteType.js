import {substituteList            } from "./substituteList.js";
import {substituteRecord          } from "./substituteRecord.js";
import {substituteDescriptors     } from "./substituteDescriptors.js";
import {substituteArray           } from "./substituteArray.js";
import {substituteAtom            } from "./substituteAtom.js";
import {substituteObject          } from "./substituteObject.js";
import {substituteIndexSignature  } from "./substituteIndexSignature.js";
import {substituteTuple           } from "./substituteTuple.js";
import {substituteReference       } from "./substituteReference.js";
import {substitutePromise         } from "./substitutePromise.js";
import {substituteSet             } from "./substituteSet.js";
import {substituteClass           } from "./substituteClass.js";
import {substituteUnion           } from "./substituteUnion.js";
import {substituteTemplateLiteral } from "./substituteTemplateLiteral.js";
import {substituteRest            } from "./substituteRest.js";
import {substituteIndexedAccess   } from "./substituteIndexedAccess.js";
import {substituteMapping         } from "./substituteMapping.js";
import {substituteIntersection    } from "./substituteIntersection.js";
import {substituteKeyof           } from "./substituteKeyof.js";
import {substituteCondition       } from "./substituteCondition.js";
import {substituteTupleMember     } from "./substituteTupleMember.js";
import {substituteRecordNode      } from "./substituteRecordNode.js";
import {substituteMapNode         } from "./substituteMapNode.js";
import {substituteTypeof          } from "./substituteTypeof.js";
import {substituteNew             } from "./substituteNew.js";
import {substituteFunction        } from "./substituteFunction.js";
import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Populates the dispatch table: every edge points outward from here, so the
 * module graph stays acyclic. Importing this module (or the package index)
 * guarantees a full table. Shorthand keys mirror the export names.
 */
Object.assign(substitutes, {
  substituteType,
  substituteList,
  substituteRecord,
  substituteDescriptors,
  substituteArray,
  substituteAtom,
  substituteObject,
  substituteIndexSignature,
  substituteTuple,
  substituteReference,
  substitutePromise,
  substituteSet,
  substituteClass,
  substituteUnion,
  substituteTemplateLiteral,
  substituteRest,
  substituteIndexedAccess,
  substituteMapping,
  substituteIntersection,
  substituteKeyof,
  substituteCondition,
  substituteTupleMember,
  substituteRecordNode,
  substituteMapNode,
  substituteTypeof,
  substituteNew,
  substituteFunction,
});
/**
 * Substitutes template references, purely: never mutates its input, and
 * unchanged subtrees are shared by identity with the input, so only the
 * rewrite path allocates — downstream identity memos keep hitting across
 * substitutions. Callers must use the return value. Single-pass (an
 * inserted replacement is never re-scanned), so a search occurring inside
 * its own replacement cannot loop; inputs must still be finite trees,
 * which holds for transpiled expects by construction. Per-branch contract:
 * substituteType.spec.js (including intersection members like `'fixed'`
 * alongside the key).
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - The warn.
 * @returns {any} - Substituted copy, sharing every unchanged subtree.
 * @example
 * substituteType({type: 'object', properties: {a: 'K'}}, 'K', '"a"', console.warn);
 * // {type: 'object', properties: {a: '"a"'}}
 */
function substituteType(type, search, replace, warn) {
  if (type === search) {
    return replace;
  }
  if (type === null || typeof type !== 'object') {
    return type;
  }
  if (typeof type.type === 'string' || typeof type.type === 'number' || typeof type.type === 'boolean') {
    const keys = Object.keys(type);
    if (keys.every((key) => key === 'type' || key === 'optional' || key === 'readonly')) {
      return substitutes.substituteAtom(type, search, replace, warn);
    }
  }
  switch (type.type) {
    case 'object':
      return substitutes.substituteObject(type, search, replace, warn);
    case 'indexSignature':
      return substitutes.substituteIndexSignature(type, search, replace, warn);
    case 'typeof':
      return substitutes.substituteTypeof(type, search, replace, warn);
    case 'tuple':
      return substitutes.substituteTuple(type, search, replace, warn);
    case 'array':
      return substitutes.substituteArray(type, search, replace, warn);
    case 'reference':
      return substitutes.substituteReference(type, search, replace, warn);
    case 'promise':
      return substitutes.substitutePromise(type, search, replace, warn);
    case 'set':
      return substitutes.substituteSet(type, search, replace, warn);
    case 'class':
      return substitutes.substituteClass(type, search, replace, warn);
    case 'union':
      return substitutes.substituteUnion(type, search, replace, warn);
    case 'templateLiteral':
      return substitutes.substituteTemplateLiteral(type, search, replace, warn);
    case 'rest':
      return substitutes.substituteRest(type, search, replace, warn);
    case 'indexedAccess':
      return substitutes.substituteIndexedAccess(type, search, replace, warn);
    case 'record':
      return substitutes.substituteRecordNode(type, search, replace, warn);
    case 'map':
      return substitutes.substituteMapNode(type, search, replace, warn);
    case 'mapping':
      return substitutes.substituteMapping(type, search, replace, warn);
    case 'intersection':
      return substitutes.substituteIntersection(type, search, replace, warn);
    case 'keyof':
      return substitutes.substituteKeyof(type, search, replace, warn);
    case 'condition':
      return substitutes.substituteCondition(type, search, replace, warn);
    case 'tupleMember':
      return substitutes.substituteTupleMember(type, search, replace, warn);
    case 'new':
      return substitutes.substituteNew(type, search, replace, warn);
    case 'function':
      return substitutes.substituteFunction(type, search, replace, warn);
    default:
      warn('substituteType: @todo unhandled', {type, search, replace});
      break;
  }
  return type;
}
export {substituteType};
