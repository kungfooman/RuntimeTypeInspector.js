/**
 * Tagged parameter/atom shapes: template refs substitute through the new
 * `paramType`/`atomType` slots on every nesting path. Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only if
 * each directive is consumed and nothing else errors; `*-errors.json` pins
 * the same sequence for RTI.
 */
/**
 * @template [K=string]
 * @param {K} bare - Bare occurrence pins.
 * @param {K[]} inArray - Ref in array element.
 * @param {{v: K}} inObject - Ref in object prop.
 * @param {(x: K) => K} inFn - Ref in function params and return.
 * @param {new (x: K) => any} inNew - Ref in constructor param.
 * @param {{[k: string]: K}} inIndex - Ref in index signature value.
 * @param {[K, K?]} inTuple - Ref in tuple, one optional member.
 * @param {K | number} inUnion - Ref in union member.
 * @param {Map<string, K>} inMap - Ref in map value.
 * @param {Set<K>} inSet - Ref in set element.
 * @param {Record<string, K>} inRecord - Ref in record value.
 * @returns {K} Pinned bare value.
 */
export function taggedShapes(bare, inArray, inObject, inFn, inNew, inIndex, inTuple, inUnion, inMap, inSet, inRecord) {
  return bare;
}
class TakesString {
  /**
   * @param {string} x - Value.
   */
  constructor(x) { this.x = x; }
}
/**
 * @param {string} s - Plain string.
 */
function takeString(s) {
  return s;
}
taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'}); // ok: every slot takes a string
takeString(taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'})); // ok: returns the pinned string
// @ts-expect-error: number is not assignable to string
taggedShapes(123, ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', [123], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', ['ok'], {v: 123}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 123}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 123]]), new Set(['ok']), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set([123]), {k: 'ok'});
// @ts-expect-error: number is not assignable to string
taggedShapes('ok', ['ok'], {v: 'ok'}, (x) => x, TakesString, {a: 'ok'}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {k: 123});
