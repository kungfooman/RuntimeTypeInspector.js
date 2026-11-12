/**
 * Indexed access over class shapes, aliases and typedef chains: `C['key']`
 * inside conditional types must decide like tsc (class side wins, chains
 * resolve, missing keys fail the branch).
 */
class IndexBase {
  constructor() {
    /** @type {string} */
    this.name = 'x';
  }
}
class IndexedWidget extends IndexBase {
  constructor() {
    super();
    /** @type {number} */
    this.size = 1;
  }
}
/**
 * @typedef {IndexedWidget} WidgetAlias
 */
/**
 * @typedef {{ direct: number }} PlainShape
 */
/**
 * @typedef {PlainShape} ShapeChain
 */
/**
 * @param {IndexedWidget['size'] extends number ? number : string} x - Class indexed access, true branch.
 * @returns {void}
 */
function checkClassIndexedTrue(x) {
}
/**
 * @param {IndexedWidget['size'] extends string ? number : string} x - Class indexed access, false branch.
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
 * @param {IndexBase['name'] extends string ? number : string} x - Inherited harvest shape merges up the chain.
 * @returns {void}
 */
function checkInheritedIndexedTrue(x) {
}
checkClassIndexedTrue(1);
checkClassIndexedTrue('a');
checkClassIndexedFalse('a');
checkClassIndexedFalse(1);
checkAliasIndexedTrue(1);
checkAliasIndexedTrue('a');
checkChainIndexedTrue(1);
checkChainIndexedTrue('a');
checkInheritedIndexedTrue(1);
checkInheritedIndexedTrue('a');
