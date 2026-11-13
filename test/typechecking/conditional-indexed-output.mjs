registerTypedef('WidgetAlias', "ConditionWidget");
registerTypedef('PlainShape', {
  "type": "object",
  "properties": {
    "direct": "number"
  }
});
registerTypedef('ShapeChain', "PlainShape");

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
registerClass(ConditionBase);
registerTypedef('ConditionBase', {
  "type": "object",
  "properties": {
    "name": "string"
  }
});
class ConditionWidget extends ConditionBase {
  constructor() {
    super();
    /** @type {number} */

    this.size = 1;
  }
}
registerClass(ConditionWidget);
registerTypedef('ConditionWidget', {
  "type": "object",
  "properties": {
    "size": "number"
  }
});

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
  if (!inspectType(x, {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "'size'",
      "object": "ConditionWidget"
    },
    "extendsType": "number",
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'checkClassIndexedTrue', 'x')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {ConditionWidget['size'] extends string ? number : string} x - Class indexed access, false branch.
 * @returns {void}
 */

function checkClassIndexedFalse(x) {
  if (!inspectType(x, {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "'size'",
      "object": "ConditionWidget"
    },
    "extendsType": "string",
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'checkClassIndexedFalse', 'x')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {WidgetAlias['size'] extends number ? number : string} x - Alias chain resolves to class shape.
 * @returns {void}
 */

function checkAliasIndexedTrue(x) {
  if (!inspectType(x, {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "'size'",
      "object": "WidgetAlias"
    },
    "extendsType": "number",
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'checkAliasIndexedTrue', 'x')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {ShapeChain['direct'] extends number ? number : string} x - Typedef chain resolves to shape.
 * @returns {void}
 */

function checkChainIndexedTrue(x) {
  if (!inspectType(x, {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "'direct'",
      "object": "ShapeChain"
    },
    "extendsType": "number",
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'checkChainIndexedTrue', 'x')) {
    youCanAddABreakpointHere();
  }
}

/**
 * @param {ConditionBase['name'] extends string ? number : string} x - Inherited harvest shape merges up the chain.
 * @returns {void}
 */

function checkInheritedIndexedTrue(x) {
  if (!inspectType(x, {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "'name'",
      "object": "ConditionBase"
    },
    "extendsType": "string",
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'checkInheritedIndexedTrue', 'x')) {
    youCanAddABreakpointHere();
  }
}
checkClassIndexedTrue(1); // ok

// @ts-expect-error: string is not number

 // ok

// @ts-expect-error: string is not number
checkClassIndexedTrue('a');
checkClassIndexedFalse('a'); // ok

// @ts-expect-error: number is not string

 // ok

// @ts-expect-error: number is not string
checkClassIndexedFalse(1);
checkAliasIndexedTrue(1); // ok

// @ts-expect-error: string is not number

 // ok

// @ts-expect-error: string is not number
checkAliasIndexedTrue('a');
checkChainIndexedTrue(1); // ok

// @ts-expect-error: string is not number

 // ok

// @ts-expect-error: string is not number
checkChainIndexedTrue('a');
checkInheritedIndexedTrue(1); // ok

// @ts-expect-error: string is not number

 // ok

// @ts-expect-error: string is not number
checkInheritedIndexedTrue('a');
