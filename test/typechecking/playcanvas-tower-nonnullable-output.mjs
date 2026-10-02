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
registerTypedef('NullHolder', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "null"
      ]
    },
    "name": "string"
  }
});
registerTypedef('NullMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "NullHolder"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "NullHolder"
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
          "object": "NullHolder"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});

/**
 * `NonNullable` key reads: `keyof NonNullable<Holder["camera"]>` denotes the
 * component keys, not the union member names, through single, doubled and
 * `| null` wrappers. A conditional map over a `| null` slot keeps working.
 * (`Component` is intentionally non-empty: tsc reads an empty base class
 * structurally, so every member would extend it.)
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


/**
 * @param {keyof NonNullable<Holder["camera"]>} prop
 */


/**
 * @typedef {{ camera: CameraComponent|undefined, name: string }} Holder
 */

/**
 * @param {keyof NonNullable<Holder["camera"]>} prop
 */
function takeCameraProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "\"camera\"",
          "object": "Holder"
        }
      ]
    },
    "optional": false
  }, 'takeCameraProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeCameraProp('clearColor'); // Expected: no issue

takeCameraProp('fov'); // Expected: no issue

takeCameraProp('CameraComponent'); // Expected: error — a type name, not a property key

takeCameraProp('name'); // Expected: error — not a camera property


/**
 * @param {keyof NonNullable<NonNullable<Holder["camera"]>|null>} prop
 */

function takeDeepProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": {
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
                  "type": "indexedAccess",
                  "index": "\"camera\"",
                  "object": "Holder"
                }
              ]
            },
            "null"
          ]
        }
      ]
    },
    "optional": false
  }, 'takeDeepProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeDeepProp('fov'); // Expected: no issue


/**
 * @typedef {{ camera: CameraComponent|null, name: string }} NullHolder
 */


/**
 * @typedef {{ [K in keyof NullHolder as NonNullable<NullHolder[K]> extends Component ? K : never]: NonNullable<NullHolder[K]> }} NullMap
 */


/**
 * @param {keyof NullMap & string} name
 */


/**
 * @typedef {{ camera: CameraComponent|null, name: string }} NullHolder
 */

/**
 * @typedef {{ [K in keyof NullHolder as NonNullable<NullHolder[K]> extends Component ? K : never]: NonNullable<NullHolder[K]> }} NullMap
 */

/**
 * @param {keyof NullMap & string} name
 */
function takeNullName(name) {
  if (!inspectType(name, {
    "type": "intersection",
    "members": [
      {
        "type": "keyof",
        "argument": "NullMap"
      },
      "string"
    ],
    "optional": false
  }, 'takeNullName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
takeNullName('camera'); // Expected: no issue

takeNullName('name'); // Expected: error — not a component name


/**
 * @param {keyof NullMap["camera"]} prop
 */

function takeNullProp(prop) {
  if (!inspectType(prop, {
    "type": "keyof",
    "argument": {
      "type": "indexedAccess",
      "index": "\"camera\"",
      "object": "NullMap"
    },
    "optional": false
  }, 'takeNullProp', 'prop')) {
    youCanAddABreakpointHere();
  }
  return prop;
}
takeNullProp('fov'); // Expected: no issue

