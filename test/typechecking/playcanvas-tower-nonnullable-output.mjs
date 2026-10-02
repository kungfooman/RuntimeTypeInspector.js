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
 */
class Component {

}
registerClass(Component);
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
    "fov": "number"
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
takeCameraProp('clearColor');
takeCameraProp('fov');
takeCameraProp('CameraComponent');
takeCameraProp('name');

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
takeDeepProp('fov');

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
takeNullName('camera');
takeNullName('name');

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
takeNullProp('fov');
