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
 * Conditional tower over a noisy entity: record, array, method and primitive
 * members are not components, so `ComponentName` rejects them while the
 * `K extends ComponentName ? ... : object` dispatch keeps typing known
 * components.
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
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color"
  }
});
class LightComponent extends Component {
  
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
    "intensity": "number"
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
   * @type {Object<string, Component>}
   */

  c = {};
  
  /**
   * @type {Array<string>}
   */

  tags = [];
  
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
    "c": {
      "type": "record",
      "key": "string",
      "val": "Component"
    },
    "tags": {
      "type": "array",
      "elementType": "string"
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
 * @param {ComponentName} name
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

/**
 * @param {ComponentName} name
 */
function addByName(name) {
  if (!inspectType(name, "ComponentName", 'addByName', 'name')) {
    youCanAddABreakpointHere();
  }
  return name;
}
addByName('camera');
addByName('light');
addByName('c');
addByName('tags');
addByName('name');
addByName('nope');
const e = new Entity();
e.addComponent('camera', {
  clearColor: new Color()
});
e.addComponent('light', {
  intensity: 2
});
e.addComponent('camera', {
  clearColor: 'x'
});
