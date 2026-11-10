
/**
 * Hostile `@overload` shapes: section-breaking markers, dotted
 * containers, swapped heads. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins
 * the same sequence for RTI.
 */
class Scripts {
  
  /**
   * @overload
   * @param {string} name - The name of the script.
   * @param {object} [args] - Object with arguments for a script.
   * @param {boolean} [args.enabled] - If script instance is enabled after creation.
   * @param {object} [args.attributes] - Object with values for attributes.
   * @returns {string|null} The instance or null.
   */
  
  /**
   * @param {string} name - The name of the script.
   * @param {object} [args] - Object with arguments for a script.
   * @param {boolean} [args.enabled] - If script instance is enabled after creation.
   * @param {object} [args.attributes] - Object with values for attributes.
   * @returns {string|null} The instance or null.
   */
  create(name, args) {
    if (!inspectOverloads([...arguments], [
      {
        "tuple": {
          "type": "tuple",
          "elements": [
            {
              "type": "tupleMember",
              "name": "name",
              "elementType": "string"
            },
            {
              "type": "tupleMember",
              "name": "args",
              "elementType": {
                "type": "object",
                "properties": {
                  "enabled": {
                    "type": "atom",
                    "atomType": "boolean",
                    "optional": true
                  },
                  "attributes": {
                    "type": "object",
                    "properties": {},
                    "optional": true
                  }
                },
                "optional": false
              },
              "optional": true
            }
          ]
        },
        "templates": {}
      }
    ], 'Scripts#create', 'arguments')) {
      youCanAddABreakpointHere();
    }
    return name;
  }
  
  /**
   * @overload
   * @param {object} [a] - First options.
   * @param {string} [a.x] - A string option.
   * @param {object} [b] - Second options.
   * @param {number} [b.y] - A number option.
   * @returns {void}
   */

  
  /**
   * @param {object} [a] - First options.
   * @param {object} [b] - Second options.
   */

  
  /**
   * @overload
   * @param {object} [a] - First options.
   * @param {string} [a.x] - A string option.
   * @param {object} [b] - Second options.
   * @param {number} [b.y] - A number option.
   * @returns {void}
   */
  
  /**
   * @param {object} [a] - First options.
   * @param {object} [b] - Second options.
   */
  two(a, b) {
    if (!inspectOverloads([...arguments], [
      {
        "tuple": {
          "type": "tuple",
          "elements": [
            {
              "type": "tupleMember",
              "name": "a",
              "elementType": {
                "type": "object",
                "properties": {
                  "x": {
                    "type": "atom",
                    "atomType": "string",
                    "optional": true
                  }
                },
                "optional": false
              },
              "optional": true
            },
            {
              "type": "tupleMember",
              "name": "b",
              "elementType": {
                "type": "object",
                "properties": {
                  "y": {
                    "type": "atom",
                    "atomType": "number",
                    "optional": true
                  }
                },
                "optional": false
              },
              "optional": true
            }
          ]
        },
        "templates": {}
      }
    ], 'Scripts#two', 'arguments')) {
      youCanAddABreakpointHere();
    }
    return undefined;
  }
  
  /**
   * @overload
   * @param label {string} - Swapped head order (matter-js spelling).
   * @returns {string}
   */

  
  /**
   * @param {string} label - The label.
   * @returns {string}
   */

  
  /**
   * @overload
   * @param label {string} - Swapped head order (matter-js spelling).
   * @returns {string}
   */
  
  /**
   * @param {string} label - The label.
   * @returns {string}
   */
  swapped(label) {
    if (!inspectOverloads([...arguments], [
      {
        "tuple": {
          "type": "tuple",
          "elements": [
            {
              "type": "tupleMember",
              "name": "label",
              "elementType": "string"
            }
          ]
        },
        "templates": {}
      }
    ], 'Scripts#swapped', 'arguments')) {
      youCanAddABreakpointHere();
    }
    return label;
  }
}
registerClass(Scripts);
registerTypedef('Scripts', {
  "type": "object",
  "properties": {
    "create": "Function",
    "two": "Function",
    "swapped": "Function"
  }
});
const scripts = new Scripts();
scripts.create('player'); // ok: args optional

scripts.create('player', {
  enabled: true
}); // ok

scripts.create('player', {
  enabled: true,
  attributes: {
    speed: 1
  }
}); // ok

// @ts-expect-error: enabled must be boolean

 // ok

// @ts-expect-error: enabled must be boolean
scripts.create('player', {
  enabled: 1
});
// @ts-expect-error: name must be a string

scripts.create(1, {
  enabled: true
});
scripts.two({
  x: 's'
}, {
  y: 1
}); // ok

// @ts-expect-error: x must be a string

 // ok

// @ts-expect-error: x must be a string
scripts.two({
  x: 1
}, {
  y: 1
});
scripts.swapped('ok'); // ok: swapped head reads the label

// @ts-expect-error: label must be a string

 // ok: swapped head reads the label

// @ts-expect-error: label must be a string
scripts.swapped(1);
