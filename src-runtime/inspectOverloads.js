import {collectCandidates} from './collectCandidates.js';
import {inspectType      } from './inspectType.js';
import {mergeCandidate   } from './mergeCandidate.js';
import {options          } from './options.js';
import {substitutedFor   } from './substitutedFor.js';
import {recurse          } from './validators.js';
/**
 * Tries complete overload signatures with independent template bindings and
 * reports a single failure if none accepts the actual arguments.
 * @param {Array<*>} args - Actual call arguments.
 * @param {{tuple: *, templates?: Record<string, *>}[]} signatures - Overload signatures.
 * @param {string} loc - Function location.
 * @param {string} name - Report label.
 * @returns {boolean} Whether one overload accepts the call.
 * @example
 * inspectOverloads([1], [{tuple: expandType('[number]')}], 'f', 'arguments'); // true
 */
function inspectOverloads(args, signatures, loc, name) {
  if (!options.enabled) {
    return true;
  }
  const members = [];
  const noop = () => undefined;
  for (const [index, signature] of signatures.entries()) {
    const templates = {...signature.templates};
    const state = {pinned: new Set(), constraints: {}};
    const {elements} = signature.tuple;
    for (let i = 0; i < args.length; i++) {
      let member = elements[i];
      if (!member && elements.length && elements[elements.length - 1].dotDot) {
        member = elements[elements.length - 1];
      }
      if (!member) {
        continue;
      }
      let expected = member;
      if (member && typeof member === 'object' && member.type === 'tupleMember') {
        expected = member.elementType;
        if (member.dotDot && expected?.type === 'array') {
          expected = expected.elementType;
        }
      }
      const site = `${name}:overload:${index}:${i}`;
      const sub = substitutedFor(expected, loc, site, templates, noop);
      const passes = recurse(args[i], sub, loc, site, false, noop, 0);
      const candidates = collectCandidates(args[i], expected);
      for (const candidate of candidates) {
        const {key, literal, value} = candidate;
        mergeCandidate(templates, state, key, literal, value, loc, site, !passes, noop);
      }
    }
    const site = `${name}:overload:${index}`;
    const tuple = substitutedFor(signature.tuple, loc, site, templates, noop);
    members.push(tuple);
    if (recurse(args, tuple, loc, name, false, noop, 0)) {
      return inspectType(args, tuple, loc, name);
    }
  }
  return inspectType(args, {type: 'union', members}, loc, name);
}
export {inspectOverloads};
