registerTypedef('MaybeCamera', {
  "type": "union",
  "members": [
    "CameraComponent",
    "null"
  ]
});
registerTypedef('DirectMaybeCameraTest', {
  "type": "condition",
  "checkType": "MaybeCamera",
  "extendsType": "Component",
  "trueType": "\"component\"",
  "falseType": "\"not-component\""
});
registerTypedef('NullComponentTest', {
  "type": "condition",
  "checkType": "null",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
});
registerTypedef('UndefinedComponentTest', {
  "type": "condition",
  "checkType": "undefined",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
});
registerTypedef('OptionalCamera', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "CameraComponent",
      "optional": true
    }
  }
});
registerTypedef('OptionalCameraMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "OptionalCamera"
  },
  "element": "K",
  "result": {
    "type": "indexedAccess",
    "index": "K",
    "object": "OptionalCamera"
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "indexedAccess",
      "index": "K",
      "object": "OptionalCamera"
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});
registerTypedef('ReNullable', {
  "type": "union",
  "members": [
    {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "union",
          "members": [
            "CameraComponent",
            "null"
          ]
        }
      ]
    },
    "null"
  ]
});
registerTypedef('ReNullableTest', {
  "type": "condition",
  "checkType": "ReNullable",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
});
registerTypedef('IsComp', {
  "type": "condition",
  "checkType": "T",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
}, ["T"]);

/**
 * Nullable-tower edge cases that DELIBERATELY change behavior with
 * `strictNullChecks`. RTI has no lax mode (it is always strict about
 * null), so `*-errors.json` pins RTI's outcomes exactly; each case below
 * documents what tsc-strict and tsc-lax report instead. Run the file with
 * tsc twice (with and without the flag) and compare: only the documented
 * lines may differ. Every other line must be silent in all three
 * configurations.
 */
class Component {
  constructor() {
    /** @type {boolean} */
    this.enabled = true;
  }
}
registerClass(Component);
registerTypedef('Component', {
  "type": "object",
  "properties": {
    "enabled": "boolean"
  }
});
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.6;
    this.b = 0.9;
    this.a = 1;
  }
}
registerClass(Color);
registerTypedef('Color', {
  "type": "object",
  "properties": {
    "r": "number",
    "g": "number",
    "b": "number",
    "a": "number"
  }
});
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Color} */

    this._clearColor = new Color();
    /** @type {number} */

    this._fov = 45;
  }
  
  /**
   * @type {Color}
   */

  get clearColor() {
    return this._clearColor;
  }
  
  /**
   * @param {Color} value
   */

  set clearColor(value) {
    this._clearColor = value;
  }
  
  /**
   * @type {number}
   */

  get fov() {
    return this._fov;
  }
  
  /**
   * @param {number} value
   */

  set fov(value) {
    this._fov = value;
  }
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color",
    "fov": "number",
    "_clearColor": "Color",
    "_fov": "number"
  }
});
// 1a. A whole nullable union against Component: without NonNullable the

// null member decides. RTI and tsc-strict reject; tsc-lax accepts (and

// then flags the unused @ts-expect-error instead).


/**
 * @typedef {CameraComponent|null} MaybeCamera
 */


/**
 * @typedef {MaybeCamera extends Component ? "component" : "not-component"} DirectMaybeCameraTest
 */


/**
 * @param {DirectMaybeCameraTest} value
 */


// 1a. A whole nullable union against Component: without NonNullable the

// null member decides. RTI and tsc-strict reject; tsc-lax accepts (and

// then flags the unused @ts-expect-error instead).

/**
 * @typedef {CameraComponent|null} MaybeCamera
 */

/**
 * @typedef {MaybeCamera extends Component ? "component" : "not-component"} DirectMaybeCameraTest
 */

/**
 * @param {DirectMaybeCameraTest} value
 */
function acceptDirectMaybeCameraResult(value) {
  if (!inspectType(value, "DirectMaybeCameraTest", 'acceptDirectMaybeCameraResult', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
// @ts-expect-error

acceptDirectMaybeCameraResult('component');
// 2. Explicit null in a conditional type: "no" under strictNullChecks

// (and RTI), "yes" without it.

// No expect-error directive here: this call must pass in this file's gate.


/**
 * @typedef {null extends Component ? "yes" : "no"} NullComponentTest
 */


/**
 * @param {NullComponentTest} value
 */


// 2. Explicit null in a conditional type: "no" under strictNullChecks

// (and RTI), "yes" without it.

// No expect-error directive here: this call must pass in this file's gate.

/**
 * @typedef {null extends Component ? "yes" : "no"} NullComponentTest
 */

/**
 * @param {NullComponentTest} value
 */
function acceptNullComponentTest(value) {
  if (!inspectType(value, "NullComponentTest", 'acceptNullComponentTest', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptNullComponentTest('no');
// 3. Explicit undefined in a conditional type: same split as case 2.


/**
 * @typedef {undefined extends Component ? "yes" : "no"} UndefinedComponentTest
 */


/**
 * @param {UndefinedComponentTest} value
 */


/**
 * @typedef {undefined extends Component ? "yes" : "no"} UndefinedComponentTest
 */

/**
 * @param {UndefinedComponentTest} value
 */
function acceptUndefinedComponentTest(value) {
  if (!inspectType(value, "UndefinedComponentTest", 'acceptUndefinedComponentTest', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptUndefinedComponentTest('no');
// 17. Optional property through a mapped conditional WITHOUT NonNullable:

// the `|undefined` from `?` decides under strictNullChecks, so the slot is

// dropped there (this call throws) while RTI and tsc-lax keep it.

// Three-way split, documented — not a bug in any system.


/**
 * @typedef {{
 *   camera?: CameraComponent
 * }} OptionalCamera
 */


/**
 * @typedef {{
 *   [K in keyof OptionalCamera
 *     as OptionalCamera[K] extends Component ? K : never]:
 *     OptionalCamera[K]
 * }} OptionalCameraMap
 */


/**
 * @param {keyof OptionalCameraMap & string} name
 */


// 17. Optional property through a mapped conditional WITHOUT NonNullable:

// the `|undefined` from `?` decides under strictNullChecks, so the slot is

// dropped there (this call throws) while RTI and tsc-lax keep it.

// Three-way split, documented — not a bug in any system.

/**
 * @typedef {{
 *   camera?: CameraComponent
 * }} OptionalCamera
 */

/**
 * @typedef {{
 *   [K in keyof OptionalCamera
 *     as OptionalCamera[K] extends Component ? K : never]:
 *     OptionalCamera[K]
 * }} OptionalCameraMap
 */

/**
 * @param {keyof OptionalCameraMap & string} name
 */
function takeOptionalCameraName(name) {
  if (!inspectType(name, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "OptionalCameraMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeOptionalCameraName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
takeOptionalCameraName('camera');
// 23. Null re-added after NonNullable: the union is whole again, so

// strictNullChecks (and RTI) reject while lax accepts.


/**
 * @typedef {NonNullable<CameraComponent|null>|null} ReNullable
 */


/**
 * @typedef {ReNullable extends Component ? "yes" : "no"} ReNullableTest
 */


/**
 * @param {ReNullableTest} value
 */


// 23. Null re-added after NonNullable: the union is whole again, so

// strictNullChecks (and RTI) reject while lax accepts.

/**
 * @typedef {NonNullable<CameraComponent|null>|null} ReNullable
 */

/**
 * @typedef {ReNullable extends Component ? "yes" : "no"} ReNullableTest
 */

/**
 * @param {ReNullableTest} value
 */
function acceptReNullableTest(value) {
  if (!inspectType(value, "ReNullableTest", 'acceptReNullableTest', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptReNullableTest('no');
// 8. Naked-parameter conditionals distribute member-wise in tsc but RTI

// decides the substituted union as one, so the null member flips this

// with the flag: silent in RTI and tsc-strict, throwing in tsc-lax.


/**
 * @template T
 * @typedef {T extends Component ? "yes" : "no"} IsComp
 */


/**
 * @param {IsComp<CameraComponent|null>} value
 */


// 8. Naked-parameter conditionals distribute member-wise in tsc but RTI

// decides the substituted union as one, so the null member flips this

// with the flag: silent in RTI and tsc-strict, throwing in tsc-lax.

/**
 * @template T
 * @typedef {T extends Component ? "yes" : "no"} IsComp
 */

/**
 * @param {IsComp<CameraComponent|null>} value
 */
function takeIsComp(value) {
  if (!inspectType(value, {
    "type": "reference",
    "name": "IsComp",
    "args": [
      {
        "type": "union",
        "members": [
          "CameraComponent",
          "null"
        ]
      }
    ],
    "optional": false
  }, 'takeIsComp', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
takeIsComp('no');
