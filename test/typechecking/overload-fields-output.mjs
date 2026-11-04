
// Computed field arrows keep their inferred names and declared arity.
const dynamicField = 'computed';
class OverloadFields {
  /** @overload @param {number} value @returns {number} */
  /** @param {number|string} value */
  action = ({
    ["action"]: (rtiParam0, ...rtiOverloadRest) => {
      const rtiOverloadStore = [rtiParam0, ...rtiOverloadRest];
      return ((value) => {

      if (!inspectOverloads(rtiOverloadStore, [
        {
          "tuple": {
            "type": "tuple",
            "elements": [
              {
                "type": "tupleMember",
                "name": "value",
                "elementType": "number"
              }
            ]
          },
          "templates": {}
        }
      ], 'OverloadFields#action', 'arguments')) {
        youCanAddABreakpointHere();
      }
        return typeof value === 'number' ? value : 0;
      }
      )(rtiParam0, ...rtiOverloadRest);
    }
  })["action"];
  /** @overload @param {number} value @returns {number} */

  /** @param {number|string} value */

  /** @overload @param {number} value @returns {number} */
  /** @param {number|string} value */
  static action = ({
    ["action"]: (rtiParam0, ...rtiOverloadRest) => {
      const rtiOverloadStore = [rtiParam0, ...rtiOverloadRest];
      return ((value) => {

      if (!inspectOverloads(rtiOverloadStore, [
        {
          "tuple": {
            "type": "tuple",
            "elements": [
              {
                "type": "tupleMember",
                "name": "value",
                "elementType": "number"
              }
            ]
          },
          "templates": {}
        }
      ], 'OverloadFields.action', 'arguments')) {
        youCanAddABreakpointHere();
      }
        return typeof value === 'number' ? value : 0;
      }
      )(rtiParam0, ...rtiOverloadRest);
    }
  })["action"];
  /** @overload @param {number} value @returns {number} */

  /** @param {number|string} value */

  /** @overload @param {number} value @returns {number} */
  /** @param {number|string} value */
  #privateAction = ({
    ["#privateAction"]: (rtiParam0, ...rtiOverloadRest) => {
      const rtiOverloadStore = [rtiParam0, ...rtiOverloadRest];
      return ((value) => {

      if (!inspectOverloads(rtiOverloadStore, [
        {
          "tuple": {
            "type": "tuple",
            "elements": [
              {
                "type": "tupleMember",
                "name": "value",
                "elementType": "number"
              }
            ]
          },
          "templates": {}
        }
      ], 'OverloadFields##privateAction', 'arguments')) {
        youCanAddABreakpointHere();
      }
        return typeof value === 'number' ? value : 0;
      }
      )(rtiParam0, ...rtiOverloadRest);
    }
  })["#privateAction"];
  /** @overload @param {number} value @returns {number} */

  /** @param {number|string} value */

  /** @overload @param {number} value @returns {number} */
  /** @param {number|string} value */
  [overloadPropertyKey((dynamicField))] = ((rtiOverloadKey) => ({
      [rtiOverloadKey]: (rtiParam0, ...rtiOverloadRest) => {
    const rtiOverloadStore = [rtiParam0, ...rtiOverloadRest];
    return ((value) => {

    if (!inspectOverloads(rtiOverloadStore, [
      {
        "tuple": {
          "type": "tuple",
          "elements": [
            {
              "type": "tupleMember",
              "name": "value",
              "elementType": "number"
            }
          ]
        },
        "templates": {}
      }
    ], 'OverloadFields#dynamicField', 'arguments')) {
      youCanAddABreakpointHere();
    }
      return typeof value === 'number' ? value : 0;
    }
    )(rtiParam0, ...rtiOverloadRest);
  }
  }))(overloadPropertyKey((dynamicField)))[overloadPropertyKey((dynamicField))];
  getPrivateAction() {
    return this.#privateAction;
  }
}
registerClass(OverloadFields);
registerTypedef('OverloadFields', {
  "type": "object",
  "properties": {
    "action": "Function",
    "getPrivateAction": "Function"
  }
});
const fields = new OverloadFields();
fields.action(1); // ok

OverloadFields.action(1); // ok

fields.getPrivateAction()(1); // ok

fields.computed(1); // ok

// @ts-expect-error The overload accepts numbers only.

 // ok

// @ts-expect-error The overload accepts numbers only.
fields.action('bad'); // warns

// @ts-expect-error The overload accepts numbers only.

 // warns

// @ts-expect-error The overload accepts numbers only.
OverloadFields.action('bad'); // warns

// @ts-expect-error The overload accepts numbers only.

 // warns

// @ts-expect-error The overload accepts numbers only.
fields.getPrivateAction()('bad'); // warns

// @ts-expect-error The overload accepts numbers only.

 // warns

// @ts-expect-error The overload accepts numbers only.
fields.computed('bad'); // warns

if (fields.action.length !== 1 || fields.action.name !== 'action') {
throw new Error('Instance metadata');
}
if (OverloadFields.action.length !== 1 || OverloadFields.action.name !== 'action') {
throw new Error('Static metadata');
}
if (fields.getPrivateAction().length !== 1 || fields.getPrivateAction().name !== '#privateAction') {
  throw new Error('Private metadata');
}
if (fields.computed.name !== 'computed') {
throw new Error('Computed name');
}
if (fields.computed.length !== 1) {
throw new Error('Computed arity');
}
