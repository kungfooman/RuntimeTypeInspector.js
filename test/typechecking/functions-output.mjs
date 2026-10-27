
/**
 * @param {string} url
 * @param {object} options Optional parameters.
 * @param {number} [options.maxRetries] Max amount of retries.
 * @param {boolean} [options.json] Text or JSON
 * @param {object|null} [options.headers]
 */
function fetchSomething(url, {
  maxRetries = 0,
  json = true,
  headers = null
}) {
  if (!inspectType(url, "string", 'fetchSomething', 'url')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(arguments[1], {
    "type": "object",
    "properties": {
      "maxRetries": {
        "type": "atom",
        "atomType": "number",
        "optional": true
      },
      "json": {
        "type": "atom",
        "atomType": "boolean",
        "optional": true
      },
      "headers": {
        "type": "union",
        "members": [
          {
            "type": "object",
            "properties": {}
          },
          "null"
        ],
        "optional": true
      }
    },
    "optional": false
  }, 'fetchSomething', 'options')) {
    youCanAddABreakpointHere();
  }
  function inner() {}
}
if (true) {
  function inIf() {}
  function inIf2() {
    return 123;
  }
}
function a() {
  "use strict";
}
function b() {}
if (true) {}
if (true) {
  "use strict";
}
if (true) {
  "use strict";
  console.log("123");
}
if (true) {
  console.log("123");
}
