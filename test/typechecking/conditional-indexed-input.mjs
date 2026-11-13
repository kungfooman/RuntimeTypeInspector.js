/**
 * Indexed access inside conditional types: `C['key']` resolves through the
 * class harvest (subclass wins), alias chains and typedef chains, matching
 * tsc branch for branch. The conditional decides the parameter type, so
 * each throwing call is pinned by its offending argument in
 * `conditional-indexed-errors.json`.
 */
class ConditionBase {
  constructor() {
    /** @type {string} */
    this.name = 'x';
  }
}
class ConditionWidget extends ConditionBase {
  constructor() {
    super();
    /** @type {number} */
    this.size = 1;
  }
}
/**
 * @typedef {ConditionWidget} WidgetAlias
 */
/**
 * @typedef {{ direct: number }} PlainShape
 */
/**
 * @typedef {PlainShape} ShapeChain
 */
/**
 * @param {ConditionWidget['size'] extends number ? number : string} x - Class indexed access, true branch.
 * @returns {void}
 */
function checkClassIndexedTrue(x) {
}
/**
 * @param {ConditionWidget['size'] extends string ? number : string} x - Class indexed access, false branch.
 * @returns {void}
 */
function checkClassIndexedFalse(x) {
}
/**
 * @param {WidgetAlias['size'] extends number ? number : string} x - Alias chain resolves to class shape.
 * @returns {void}
 */
function checkAliasIndexedTrue(x) {
}
/**
 * @param {ShapeChain['direct'] extends number ? number : string} x - Typedef chain resolves to shape.
 * @returns {void}
 */
function checkChainIndexedTrue(x) {
}
/**
 * @param {ConditionBase['name'] extends string ? number : string} x - Inherited harvest shape merges up the chain.
 * @returns {void}
 */
function checkInheritedIndexedTrue(x) {
}
checkClassIndexedTrue(1); // ok
// @ts-expect-error: string is not number
checkClassIndexedTrue('a');
checkClassIndexedFalse('a'); // ok
// @ts-expect-error: number is not string
checkClassIndexedFalse(1);
checkAliasIndexedTrue(1); // ok
// @ts-expect-error: string is not number
checkAliasIndexedTrue('a');
checkChainIndexedTrue(1); // ok
// @ts-expect-error: string is not number
checkChainIndexedTrue('a');
checkInheritedIndexedTrue(1); // ok
// @ts-expect-error: string is not number
checkInheritedIndexedTrue('a');
