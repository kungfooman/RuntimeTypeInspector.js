registerTypedef('ComponentMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "Entity"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "Entity"
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
          "object": "Entity"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});
registerTypedef('ComponentName', {
  "type": "intersection",
  "members": [
    {
      "type": "keyof",
      "argument": "ComponentMap"
    },
    "string"
  ]
});
registerTypedef('OptionsByName', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "object",
      "properties": {
        "clearColor": "Color"
      }
    },
    "light": {
      "type": "object",
      "properties": {
        "intensity": "number"
      }
    }
  }
});

/**
 * Repeated `addComponent` checks with the same component name must share the
 * resolved options shape instead of rebuilding it per call (the scroll-view
 * example spent 161 s resolving the same options tower 260 times). Repeats
 * with good values stay quiet, repeats with bad values still throw, and
 * alternating names never mix their shapes. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI. (`Component` is intentionally non-empty: tsc reads
 * an empty base class structurally, so every member would extend it.)
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
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color",
    "_clearColor": "Color"
  }
});
class LightComponent extends Component {
  constructor() {
    super();
    /** @type {number} */

    this._intensity = 1;
  }
  
  /**
   * @type {number}
   */

  get intensity() {
    return this._intensity;
  }
  
  /**
   * @param {number} value
   */

  set intensity(value) {
    this._intensity = value;
  }
}
registerClass(LightComponent);
registerTypedef('LightComponent', {
  "type": "object",
  "properties": {
    "intensity": "number",
    "_intensity": "number"
  }
});
class Entity {
  
  /**
   * @type {CameraComponent|undefined}
   * @readonly
   */
  camera;
  
  /**
   * @type {LightComponent|undefined}
   * @readonly
   */

  light;
  
  /**
   * @type {string}
   */

  name = 'x';
  
  /**
   * @template {ComponentName | (string & {})} K
   * @param {K} type
   * @param {K extends ComponentName ? OptionsByName[K] : object} [data]
   * @returns {*} comp
   */

  addComponent(type, data) {
    const rtiTemplates = {
      "K": {
        "type": "union",
        "members": [
          "ComponentName",
          {
            "type": "intersection",
            "members": [
              "string",
              {
                "type": "object"
              }
            ]
          }
        ]
      }
    };
    if (!inspectTypeWithTemplates(type, "K", 'Entity#addComponent', 'type', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(data, {
      "type": "condition",
      "checkType": "K",
      "extendsType": "ComponentName",
      "trueType": {
        "type": "indexedAccess",
        "index": "K",
        "object": "OptionsByName"
      },
      "falseType": {
        "type": "object",
        "properties": {}
      },
      "optional": true
    }, 'Entity#addComponent', 'data', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    return [type, data];
  }
}
registerClass(Entity);
registerTypedef('Entity', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "undefined"
      ],
      "readonly": true
    },
    "light": {
      "type": "union",
      "members": [
        "LightComponent",
        "undefined"
      ],
      "readonly": true
    },
    "name": "string",
    "addComponent": "Function"
  }
});

/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */


/**
 * @typedef {keyof ComponentMap & string} ComponentName
 */


/**
 * @typedef {{ camera: { clearColor: Color }, light: { intensity: number } }} OptionsByName
 */


/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */

/**
 * @typedef {keyof ComponentMap & string} ComponentName
 */

/**
 * @typedef {{ camera: { clearColor: Color }, light: { intensity: number } }} OptionsByName
 */
const e = new Entity();
e.addComponent('camera', {
  clearColor: new Color()
});
e.addComponent('camera', {
  clearColor: new Color()
});
// @ts-expect-error: repeat with a bad value still throws

e.addComponent('camera', {
  clearColor: 'x'
});
e.addComponent('light', {
  intensity: 2
});
// @ts-expect-error: wrong type for the other name

e.addComponent('light', {
  intensity: 'x'
});
e.addComponent('camera', {
  clearColor: new Color()
});
