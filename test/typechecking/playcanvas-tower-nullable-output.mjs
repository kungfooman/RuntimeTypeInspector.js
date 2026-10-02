registerTypedef('Holder', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "undefined"
      ]
    },
    "name": "string"
  }
});
registerTypedef('MaybeCamera', {
  "type": "union",
  "members": [
    "CameraComponent",
    "null"
  ]
});
registerTypedef('NonNullableMaybeCameraTest', {
  "type": "condition",
  "checkType": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      "MaybeCamera"
    ]
  },
  "extendsType": "Component",
  "trueType": "\"component\"",
  "falseType": "\"not-component\""
});
registerTypedef('DoubleNonNullable', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
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
        "undefined"
      ]
    }
  ]
});
registerTypedef('TripleNullable', {
  "type": "union",
  "members": [
    "CameraComponent",
    "null",
    "undefined"
  ]
});
registerTypedef('TripleNullableStripped', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "TripleNullable"
  ]
});
registerTypedef('MixedUnion', {
  "type": "union",
  "members": [
    "CameraComponent",
    false,
    0,
    "\"\"",
    "null",
    "undefined"
  ]
});
registerTypedef('MixedUnionStripped', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "MixedUnion"
  ]
});
registerTypedef('ComponentUnion', {
  "type": "union",
  "members": [
    "CameraComponent",
    "Color"
  ]
});
registerTypedef('ComponentUnionTest', {
  "type": "condition",
  "checkType": "ComponentUnion",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
});
registerTypedef('CameraSlots', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "backupCamera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "undefined"
      ]
    },
    "empty": "null",
    "missing": "undefined"
  }
});
registerTypedef('OnlyNull', {
  "type": "object",
  "properties": {
    "value": "null"
  }
});
registerTypedef('RemovedEverything', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"value\"",
      "object": "OnlyNull"
    }
  ]
});
registerTypedef('OnlyUndefined', {
  "type": "object",
  "properties": {
    "value": "undefined"
  }
});
registerTypedef('RemovedUndefined', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"value\"",
      "object": "OnlyUndefined"
    }
  ]
});
registerTypedef('NestedHolder', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        {
          "type": "object",
          "properties": {
            "component": {
              "type": "union",
              "members": [
                "CameraComponent",
                "null"
              ]
            }
          }
        },
        "null"
      ]
    }
  }
});
registerTypedef('NestedCamera', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"camera\"",
      "object": "NestedHolder"
    }
  ]
});
registerTypedef('NestedComponent', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"component\"",
      "object": "NestedCamera"
    }
  ]
});
registerTypedef('DeepNullableHolder', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        {
          "type": "union",
          "members": [
            {
              "type": "object",
              "properties": {
                "component": {
                  "type": "union",
                  "members": [
                    {
                      "type": "union",
                      "members": [
                        "CameraComponent",
                        "null"
                      ]
                    },
                    "undefined"
                  ]
                }
              }
            },
            "null"
          ]
        },
        "undefined"
      ]
    }
  }
});
registerTypedef('DeepCameraComponent', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"component\"",
      "object": {
        "type": "reference",
        "name": "NonNullable",
        "args": [
          {
            "type": "indexedAccess",
            "index": "\"camera\"",
            "object": "DeepNullableHolder"
          }
        ]
      }
    }
  ]
});
registerTypedef('OptionalNullMapSource', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "name": {
      "type": "union",
      "members": [
        "string",
        "null"
      ]
    },
    "optionalCamera": {
      "type": "CameraComponent",
      "optional": true
    }
  }
});
registerTypedef('OptionalNullMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "OptionalNullMapSource"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "OptionalNullMapSource"
      }
    ]
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "OptionalNullMapSource"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
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
registerTypedef('OptionalCameraValue', {
  "type": "indexedAccess",
  "index": "\"camera\"",
  "object": "OptionalCamera"
});
registerTypedef('OptionalCameraNonNull', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "OptionalCameraValue"
  ]
});
registerTypedef('RequiredAndOptional', {
  "type": "object",
  "properties": {
    "required": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "optional": {
      "type": "CameraComponent",
      "optional": true
    }
  }
});
registerTypedef('RequiredAndOptionalMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "RequiredAndOptional"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "RequiredAndOptional"
      }
    ]
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "RequiredAndOptional"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});
registerTypedef('CameraInstance', {
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
});
registerTypedef('IntersectedNullable', {
  "type": "union",
  "members": [
    {
      "type": "intersection",
      "members": [
        "CameraComponent",
        {
          "type": "object"
        }
      ]
    },
    "null"
  ]
});
registerTypedef('IntersectedNonNull', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "IntersectedNullable"
  ]
});
registerTypedef('ParenthesizedNullable', {
  "type": "union",
  "members": [
    {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "undefined"
  ]
});
registerTypedef('ParenthesizedNonNull', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "ParenthesizedNullable"
  ]
});
registerTypedef('OneCameraMap', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    }
  }
});
registerTypedef('FirstStrip', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    {
      "type": "indexedAccess",
      "index": "\"camera\"",
      "object": "OneCameraMap"
    }
  ]
});
registerTypedef('SecondStrip', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "FirstStrip"
  ]
});
registerTypedef('MultipleComponents', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "other": {
      "type": "union",
      "members": [
        "Component",
        "null"
      ]
    }
  }
});
registerTypedef('MultipleComponentsMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "MultipleComponents"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "MultipleComponents"
      }
    ]
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "MultipleComponents"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});
registerTypedef('MixedComponentString', {
  "type": "union",
  "members": [
    "CameraComponent",
    "string",
    "null"
  ]
});
registerTypedef('MixedComponentStringTest', {
  "type": "condition",
  "checkType": "MixedComponentString",
  "extendsType": "Component",
  "trueType": "\"yes\"",
  "falseType": "\"no\""
});
registerTypedef('ManualNullable', {
  "type": "union",
  "members": [
    "CameraComponent",
    "null",
    "undefined"
  ]
});
registerTypedef('ManualNullCheck', {
  "type": "condition",
  "checkType": "ManualNullable",
  "extendsType": {
    "type": "union",
    "members": [
      "null",
      "undefined"
    ]
  },
  "trueType": "\"empty\"",
  "falseType": "\"nonempty\""
});
registerTypedef('EquivalentNonNullCheck', {
  "type": "condition",
  "checkType": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      "ManualNullable"
    ]
  },
  "extendsType": "CameraComponent",
  "trueType": "\"camera\"",
  "falseType": "\"other\""
});
registerTypedef('WrappedHolder', {
  "type": "object",
  "properties": {
    "holder": {
      "type": "union",
      "members": [
        "Holder",
        "null"
      ]
    }
  }
});
registerTypedef('WrappedCamera', {
  "type": "indexedAccess",
  "index": "\"camera\"",
  "object": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "\"holder\"",
        "object": "WrappedHolder"
      }
    ]
  }
});
registerTypedef('WrappedCameraNonNull', {
  "type": "reference",
  "name": "NonNullable",
  "args": [
    "WrappedCamera"
  ]
});
registerTypedef('NothingUseful', {
  "type": "object",
  "properties": {
    "value": "null",
    "other": "undefined"
  }
});
registerTypedef('EmptyComponentMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "NothingUseful"
  },
  "element": "K",
  "result": {
    "type": "indexedAccess",
    "index": "K",
    "object": "NothingUseful"
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "NothingUseful"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});

/**
 * Nullable-tower edge cases that must behave IDENTICALLY with
 * strictNullChecks on and off (and in RTI, which has no lax mode):
 * `NonNullable` idempotence and precision, conditional distribution over
 * concrete unions, mapped filtering over nullable slots, and keyof never
 * leaking member names. Every throwing call carries `@ts-expect-error`,
 * so a tsc-strict run is green if and only if each directive is consumed
 * and nothing else errors; `*-errors.json` pins the same sequence for
 * RTI. Bare calls must stay silent everywhere.
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

/**
 * @typedef {{ camera: CameraComponent|undefined, name: string }} Holder
 */

// 1b. NonNullable around the union is stable in every mode.


/**
 * @typedef {CameraComponent|null} MaybeCamera
 */


/**
 * @typedef {NonNullable<MaybeCamera> extends Component ? "component" : "not-component"} NonNullableMaybeCameraTest
 */


/**
 * @param {NonNullableMaybeCameraTest} value
 */


/**
 * @typedef {{ camera: CameraComponent|undefined, name: string }} Holder
 */

/**
 * @typedef {CameraComponent|null} MaybeCamera
 */

/**
 * @typedef {NonNullable<MaybeCamera> extends Component ? "component" : "not-component"} NonNullableMaybeCameraTest
 */

/**
 * @param {NonNullableMaybeCameraTest} value
 */
function acceptNonNullableMaybeCameraResult(value) {
  if (!inspectType(value, "NonNullableMaybeCameraTest", 'acceptNonNullableMaybeCameraResult', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptNonNullableMaybeCameraResult('component');
// 4. Double NonNullable is idempotent.


/**
 * @typedef {NonNullable<NonNullable<CameraComponent|null>|undefined>} DoubleNonNullable
 */


/**
 * @param {keyof DoubleNonNullable} prop
 */


/**
 * @typedef {NonNullable<NonNullable<CameraComponent|null>|undefined>} DoubleNonNullable
 */

/**
 * @param {keyof DoubleNonNullable} prop
 */
function takeDoubleNonNullableProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "DoubleNonNullable",
    "optional": false
  }, 'takeDoubleNonNullableProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeDoubleNonNullableProp('clearColor');
takeDoubleNonNullableProp('fov');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeDoubleNonNullableProp('name');
// 5. NonNullable strips every nullish member, not just the first.


/**
 * @typedef {CameraComponent|null|undefined} TripleNullable
 */


/**
 * @typedef {NonNullable<TripleNullable>} TripleNullableStripped
 */


/**
 * @param {keyof TripleNullableStripped} prop
 */


/**
 * @typedef {CameraComponent|null|undefined} TripleNullable
 */

/**
 * @typedef {NonNullable<TripleNullable>} TripleNullableStripped
 */

/**
 * @param {keyof TripleNullableStripped} prop
 */
function takeTripleNullableProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "TripleNullableStripped",
    "optional": false
  }, 'takeTripleNullableProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeTripleNullableProp('clearColor');
takeTripleNullableProp('fov');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeTripleNullableProp('name');
// 6. NonNullable removes only null/undefined: false, 0 and "" survive,

// so the whole union still does not extend Component.


/**
 * @typedef {CameraComponent|false|0|""|null|undefined} MixedUnion
 */


/**
 * @typedef {NonNullable<MixedUnion>} MixedUnionStripped
 */


/**
 * @param {MixedUnionStripped extends Component ? "yes" : "no"} value
 */


// 6. NonNullable removes only null/undefined: false, 0 and "" survive,

// so the whole union still does not extend Component.

/**
 * @typedef {CameraComponent|false|0|""|null|undefined} MixedUnion
 */

/**
 * @typedef {NonNullable<MixedUnion>} MixedUnionStripped
 */

/**
 * @param {MixedUnionStripped extends Component ? "yes" : "no"} value
 */
function acceptMixedUnionResult(value) {
  if (!inspectType(value, {
    "type": "condition",
    "checkType": "MixedUnionStripped",
    "extendsType": "Component",
    "trueType": "\"yes\"",
    "falseType": "\"no\"",
    "optional": false
  }, 'acceptMixedUnionResult', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptMixedUnionResult('no');
// 7. A union where only one branch is a Component is not one: catches

// "any member extends" behavior in conditional checks.


/**
 * @typedef {CameraComponent|Color} ComponentUnion
 */


/**
 * @typedef {ComponentUnion extends Component ? "yes" : "no"} ComponentUnionTest
 */


/**
 * @param {ComponentUnionTest} value
 */


// 7. A union where only one branch is a Component is not one: catches

// "any member extends" behavior in conditional checks.

/**
 * @typedef {CameraComponent|Color} ComponentUnion
 */

/**
 * @typedef {ComponentUnion extends Component ? "yes" : "no"} ComponentUnionTest
 */

/**
 * @param {ComponentUnionTest} value
 */
function acceptComponentUnionTest(value) {
  if (!inspectType(value, "ComponentUnionTest", 'acceptComponentUnionTest', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptComponentUnionTest('no');
// 10. Nullable property extraction followed by NonNullable.


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   backupCamera: CameraComponent|undefined,
 *   empty: null,
 *   missing: undefined
 * }} CameraSlots
 */


/**
 * @param {keyof NonNullable<CameraSlots["camera"]>} prop
 */


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   backupCamera: CameraComponent|undefined,
 *   empty: null,
 *   missing: undefined
 * }} CameraSlots
 */

/**
 * @param {keyof NonNullable<CameraSlots["camera"]>} prop
 */
function takeCameraSlotProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "\"camera\"",
          "object": "CameraSlots"
        }
      ]
    },
    "optional": false
  }, 'takeCameraSlotProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeCameraSlotProp('clearColor');
takeCameraSlotProp('fov');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeCameraSlotProp('name');
// 11. NonNullable on a definitely-null property becomes never. No calls:

// there is no value of that type to pass.


/**
 * @typedef {{ value: null }} OnlyNull
 */


/**
 * @typedef {NonNullable<OnlyNull["value"]>} RemovedEverything
 */


/**
 * @param {keyof RemovedEverything} prop
 */


// 11. NonNullable on a definitely-null property becomes never. No calls:

// there is no value of that type to pass.

/**
 * @typedef {{ value: null }} OnlyNull
 */

/**
 * @typedef {NonNullable<OnlyNull["value"]>} RemovedEverything
 */

/**
 * @param {keyof RemovedEverything} prop
 */
function takeRemovedEverything(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "RemovedEverything",
    "optional": false
  }, 'takeRemovedEverything', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
// 12. Same for a definitely-undefined property.


/**
 * @typedef {{ value: undefined }} OnlyUndefined
 */


/**
 * @typedef {NonNullable<OnlyUndefined["value"]>} RemovedUndefined
 */


/**
 * @param {keyof RemovedUndefined} prop
 */


/**
 * @typedef {{ value: undefined }} OnlyUndefined
 */

/**
 * @typedef {NonNullable<OnlyUndefined["value"]>} RemovedUndefined
 */

/**
 * @param {keyof RemovedUndefined} prop
 */
function takeRemovedUndefined(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "RemovedUndefined",
    "optional": false
  }, 'takeRemovedUndefined', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
// 13. Nested nullable object property, stripped level by level.


/**
 * @typedef {{
 *   camera: {
 *     component: CameraComponent|null
 *   }|null
 * }} NestedHolder
 */


/**
 * @typedef {NonNullable<NestedHolder["camera"]>} NestedCamera
 */


/**
 * @typedef {NonNullable<NestedCamera["component"]>} NestedComponent
 */


/**
 * @param {keyof NestedComponent} prop
 */


/**
 * @typedef {{
 *   camera: {
 *     component: CameraComponent|null
 *   }|null
 * }} NestedHolder
 */

/**
 * @typedef {NonNullable<NestedHolder["camera"]>} NestedCamera
 */

/**
 * @typedef {NonNullable<NestedCamera["component"]>} NestedComponent
 */

/**
 * @param {keyof NestedComponent} prop
 */
function takeNestedComponentProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "NestedComponent",
    "optional": false
  }, 'takeNestedComponentProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeNestedComponentProp('clearColor');
takeNestedComponentProp('fov');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeNestedComponentProp('name');
// 14. Deep nesting with null introduced at every level.


/**
 * @typedef {{
 *   camera: ({
 *     component: (CameraComponent|null)|undefined
 *   }|null)|undefined
 * }} DeepNullableHolder
 */


/**
 * @typedef {NonNullable<
 *   NonNullable<
 *     DeepNullableHolder["camera"]
 *   >["component"]
 * >} DeepCameraComponent
 */


/**
 * @param {keyof DeepCameraComponent} prop
 */


/**
 * @typedef {{
 *   camera: ({
 *     component: (CameraComponent|null)|undefined
 *   }|null)|undefined
 * }} DeepNullableHolder
 */

/**
 * @typedef {NonNullable<
 *   NonNullable<
 *     DeepNullableHolder["camera"]
 *   >["component"]
 * >} DeepCameraComponent
 */

/**
 * @param {keyof DeepCameraComponent} prop
 */
function takeDeepCameraProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "DeepCameraComponent",
    "optional": false
  }, 'takeDeepCameraProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeDeepCameraProp('clearColor');
takeDeepCameraProp('fov');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeDeepCameraProp('name');
// 15. Mapped filtering keeps optional slots; the value is NonNullable.


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   name: string|null,
 *   optionalCamera?: CameraComponent
 * }} OptionalNullMapSource
 */


/**
 * @typedef {{
 *   [K in keyof OptionalNullMapSource
 *     as NonNullable<OptionalNullMapSource[K]> extends Component ? K : never]:
 *     NonNullable<OptionalNullMapSource[K]>
 * }} OptionalNullMap
 */


/**
 * @param {keyof OptionalNullMap & string} name
 */


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   name: string|null,
 *   optionalCamera?: CameraComponent
 * }} OptionalNullMapSource
 */

/**
 * @typedef {{
 *   [K in keyof OptionalNullMapSource
 *     as NonNullable<OptionalNullMapSource[K]> extends Component ? K : never]:
 *     NonNullable<OptionalNullMapSource[K]>
 * }} OptionalNullMap
 */

/**
 * @param {keyof OptionalNullMap & string} name
 */
function takeOptionalNullName(name) {
  if (!inspectType(name, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "OptionalNullMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeOptionalNullName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
takeOptionalNullName('camera');
takeOptionalNullName('optionalCamera');
// 'name' is a string slot, not a component.

// @ts-expect-error


// 'name' is a string slot, not a component.

// @ts-expect-error
takeOptionalNullName('name');
// 16. Optional property through NonNullable key reads.


/**
 * @typedef {{
 *   camera?: CameraComponent
 * }} OptionalCamera
 */


/**
 * @typedef {OptionalCamera["camera"]} OptionalCameraValue
 */


/**
 * @typedef {NonNullable<OptionalCameraValue>} OptionalCameraNonNull
 */


/**
 * @param {keyof OptionalCameraNonNull} prop
 */


/**
 * @typedef {{
 *   camera?: CameraComponent
 * }} OptionalCamera
 */

/**
 * @typedef {OptionalCamera["camera"]} OptionalCameraValue
 */

/**
 * @typedef {NonNullable<OptionalCameraValue>} OptionalCameraNonNull
 */

/**
 * @param {keyof OptionalCameraNonNull} prop
 */
function takeOptionalCameraProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "OptionalCameraNonNull",
    "optional": false
  }, 'takeOptionalCameraProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeOptionalCameraProp('clearColor');
takeOptionalCameraProp('fov');
// 18. Required nullable and optional component slots both survive.


/**
 * @typedef {{
 *   required: CameraComponent|null,
 *   optional?: CameraComponent
 * }} RequiredAndOptional
 */


/**
 * @typedef {{
 *   [K in keyof RequiredAndOptional
 *     as NonNullable<RequiredAndOptional[K]> extends Component ? K : never]:
 *     NonNullable<RequiredAndOptional[K]>
 * }} RequiredAndOptionalMap
 */


/**
 * @param {keyof RequiredAndOptionalMap & string} name
 */


/**
 * @typedef {{
 *   required: CameraComponent|null,
 *   optional?: CameraComponent
 * }} RequiredAndOptional
 */

/**
 * @typedef {{
 *   [K in keyof RequiredAndOptional
 *     as NonNullable<RequiredAndOptional[K]> extends Component ? K : never]:
 *     NonNullable<RequiredAndOptional[K]>
 * }} RequiredAndOptionalMap
 */

/**
 * @param {keyof RequiredAndOptionalMap & string} name
 */
function takeRequiredOptionalName(name) {
  if (!inspectType(name, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "RequiredAndOptionalMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeRequiredOptionalName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
takeRequiredOptionalName('required');
takeRequiredOptionalName('optional');
// 19. keyof after NonNullable exposes instance members only.


/**
 * @typedef {NonNullable<CameraComponent|null>} CameraInstance
 */


/**
 * @param {keyof CameraInstance} key
 */


/**
 * @typedef {NonNullable<CameraComponent|null>} CameraInstance
 */

/**
 * @param {keyof CameraInstance} key
 */
function takeInstanceKey(key) {
  if (!inspectType(key, {
    "type": "keyof",
    "argument": "CameraInstance",
    "optional": false
  }, 'takeInstanceKey', 'key')) {
    youCanAddABreakpointHere();
  }
  return key;
}
takeInstanceKey('clearColor');
takeInstanceKey('fov');
// A type name is not a key.

// @ts-expect-error


// A type name is not a key.

// @ts-expect-error
takeInstanceKey('CameraComponent');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeInstanceKey('name');
// 21. Instance intersection with null strips to the instance keys.


/**
 * @typedef {(CameraComponent & {})|null} IntersectedNullable
 */


/**
 * @typedef {NonNullable<IntersectedNullable>} IntersectedNonNull
 */


/**
 * @param {keyof IntersectedNonNull} prop
 */


/**
 * @typedef {(CameraComponent & {})|null} IntersectedNullable
 */

/**
 * @typedef {NonNullable<IntersectedNullable>} IntersectedNonNull
 */

/**
 * @param {keyof IntersectedNonNull} prop
 */
function takeIntersectedProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "IntersectedNonNull",
    "optional": false
  }, 'takeIntersectedProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeIntersectedProp('clearColor');
takeIntersectedProp('fov');
// 22. Parenthesization of nullable unions is transparent.


/**
 * @typedef {((CameraComponent|null)|undefined)} ParenthesizedNullable
 */


/**
 * @typedef {NonNullable<ParenthesizedNullable>} ParenthesizedNonNull
 */


/**
 * @param {keyof ParenthesizedNonNull} prop
 */


/**
 * @typedef {((CameraComponent|null)|undefined)} ParenthesizedNullable
 */

/**
 * @typedef {NonNullable<ParenthesizedNullable>} ParenthesizedNonNull
 */

/**
 * @param {keyof ParenthesizedNonNull} prop
 */
function takeParenthesizedProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "ParenthesizedNonNull",
    "optional": false
  }, 'takeParenthesizedProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeParenthesizedProp('clearColor');
takeParenthesizedProp('fov');
// 24. NonNullable stays idempotent after a mapped type.


/**
 * @typedef {{
 *   camera: CameraComponent|null
 * }} OneCameraMap
 */


/**
 * @typedef {NonNullable<OneCameraMap["camera"]>} FirstStrip
 */


/**
 * @typedef {NonNullable<FirstStrip>} SecondStrip
 */


/**
 * @param {keyof SecondStrip} prop
 */


/**
 * @typedef {{
 *   camera: CameraComponent|null
 * }} OneCameraMap
 */

/**
 * @typedef {NonNullable<OneCameraMap["camera"]>} FirstStrip
 */

/**
 * @typedef {NonNullable<FirstStrip>} SecondStrip
 */

/**
 * @param {keyof SecondStrip} prop
 */
function takeSecondStripProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "SecondStrip",
    "optional": false
  }, 'takeSecondStripProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeSecondStripProp('clearColor');
takeSecondStripProp('fov');
// 25. Union of nullable component slots, including a base-class slot.


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   other: Component|null
 * }} MultipleComponents
 */


/**
 * @typedef {{
 *   [K in keyof MultipleComponents
 *     as NonNullable<MultipleComponents[K]> extends Component ? K : never]:
 *     NonNullable<MultipleComponents[K]>
 * }} MultipleComponentsMap
 */


/**
 * @param {keyof MultipleComponentsMap & string} name
 */


/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   other: Component|null
 * }} MultipleComponents
 */

/**
 * @typedef {{
 *   [K in keyof MultipleComponents
 *     as NonNullable<MultipleComponents[K]> extends Component ? K : never]:
 *     NonNullable<MultipleComponents[K]>
 * }} MultipleComponentsMap
 */

/**
 * @param {keyof MultipleComponentsMap & string} name
 */
function takeMultipleComponentName(name) {
  if (!inspectType(name, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "MultipleComponentsMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeMultipleComponentName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
takeMultipleComponentName('camera');
takeMultipleComponentName('other');
// Unknown slot.

// @ts-expect-error


// Unknown slot.

// @ts-expect-error
takeMultipleComponentName('missing');
// 26. A union where only one branch is a Component is not one.


/**
 * @typedef {CameraComponent|string|null} MixedComponentString
 */


/**
 * @typedef {MixedComponentString extends Component ? "yes" : "no"} MixedComponentStringTest
 */


/**
 * @param {MixedComponentStringTest} value
 */


/**
 * @typedef {CameraComponent|string|null} MixedComponentString
 */

/**
 * @typedef {MixedComponentString extends Component ? "yes" : "no"} MixedComponentStringTest
 */

/**
 * @param {MixedComponentStringTest} value
 */
function acceptMixedComponentStringTest(value) {
  if (!inspectType(value, "MixedComponentStringTest", 'acceptMixedComponentStringTest', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptMixedComponentStringTest('no');
// 27. Manual null/undefined union check agrees with NonNullable.


/**
 * @typedef {CameraComponent|null|undefined} ManualNullable
 */


/**
 * @typedef {ManualNullable extends null|undefined ? "empty" : "nonempty"} ManualNullCheck
 */


/**
 * @typedef {NonNullable<ManualNullable> extends CameraComponent ? "camera" : "other"} EquivalentNonNullCheck
 */


/**
 * @param {ManualNullCheck} value
 */


/**
 * @typedef {CameraComponent|null|undefined} ManualNullable
 */

/**
 * @typedef {ManualNullable extends null|undefined ? "empty" : "nonempty"} ManualNullCheck
 */

/**
 * @typedef {NonNullable<ManualNullable> extends CameraComponent ? "camera" : "other"} EquivalentNonNullCheck
 */

/**
 * @param {ManualNullCheck} value
 */
function acceptManualNullCheck(value) {
  if (!inspectType(value, "ManualNullCheck", 'acceptManualNullCheck', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}

/**
 * @param {EquivalentNonNullCheck} value
 */

function acceptEquivalentNonNullCheck(value) {
  if (!inspectType(value, "EquivalentNonNullCheck", 'acceptEquivalentNonNullCheck', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
acceptManualNullCheck('nonempty');
acceptEquivalentNonNullCheck('camera');
// 29. Property access through a nullable indexed access.


/**
 * @typedef {{
 *   holder: Holder|null
 * }} WrappedHolder
 */


/**
 * @typedef {NonNullable<WrappedHolder["holder"]>["camera"]} WrappedCamera
 */


/**
 * @typedef {NonNullable<WrappedCamera>} WrappedCameraNonNull
 */


/**
 * @param {keyof WrappedCameraNonNull} prop
 */


/**
 * @typedef {{
 *   holder: Holder|null
 * }} WrappedHolder
 */

/**
 * @typedef {NonNullable<WrappedHolder["holder"]>["camera"]} WrappedCamera
 */

/**
 * @typedef {NonNullable<WrappedCamera>} WrappedCameraNonNull
 */

/**
 * @param {keyof WrappedCameraNonNull} prop
 */
function takeWrappedCameraProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": "WrappedCameraNonNull",
    "optional": false
  }, 'takeWrappedCameraProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeWrappedCameraProp('clearColor');
takeWrappedCameraProp('fov');
// 30. Class name, property name and instance property stay distinct.


/**
 * @param {keyof CameraComponent} key
 */

function takeOnlyActualCameraKeys(key) {
  if (!inspectType(key, {
    "type": "keyof",
    "argument": "CameraComponent",
    "optional": false
  }, 'takeOnlyActualCameraKeys', 'key')) {
    youCanAddABreakpointHere();
  }
  return key;
}
takeOnlyActualCameraKeys('clearColor');
takeOnlyActualCameraKeys('fov');
// A type name is not a key.

// @ts-expect-error


// A type name is not a key.

// @ts-expect-error
takeOnlyActualCameraKeys('CameraComponent');
// 'name' is not a camera key.

// @ts-expect-error


// 'name' is not a camera key.

// @ts-expect-error
takeOnlyActualCameraKeys('name');
// 28. Never-valued slots are kept, not dropped: `never extends Component`

// holds, so the map is not empty. Silent in every configuration (no

// directives: there is nothing to throw).


/**
 * @typedef {{ value: null, other: undefined }} NothingUseful
 */


/**
 * @typedef {{
 *   [K in keyof NothingUseful
 *     as NonNullable<NothingUseful[K]> extends Component ? K : never]:
 *     NothingUseful[K]
 * }} EmptyComponentMap
 */


/**
 * @param {keyof EmptyComponentMap & string} key
 */


// 28. Never-valued slots are kept, not dropped: `never extends Component`

// holds, so the map is not empty. Silent in every configuration (no

// directives: there is nothing to throw).

/**
 * @typedef {{ value: null, other: undefined }} NothingUseful
 */

/**
 * @typedef {{
 *   [K in keyof NothingUseful
 *     as NonNullable<NothingUseful[K]> extends Component ? K : never]:
 *     NothingUseful[K]
 * }} EmptyComponentMap
 */

/**
 * @param {keyof EmptyComponentMap & string} key
 */
function takeEmptyComponentKey(key) {
  if (!inspectType(key, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "EmptyComponentMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeEmptyComponentKey', 'key')) {
    youCanAddABreakpointHere();
  }
  return key;
}
takeEmptyComponentKey('value');
takeEmptyComponentKey('other');
