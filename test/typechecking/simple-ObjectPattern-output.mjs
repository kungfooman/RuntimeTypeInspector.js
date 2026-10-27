
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
  console.log('fetchSomething>', {
    url,
    maxRetries,
    json,
    headers,
  });
}
const ret = fetchSomething("test.gltf", {
  maxRetries: 2
});
console.log('ret', ret);
