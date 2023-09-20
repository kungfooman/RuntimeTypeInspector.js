/**
 * @param {string} url
 * @param {object} [options] Optional parameters.
 * @param {number} [options.maxRetries] Max amount of retries.
 * @param {boolean} [options.json] Text or JSON
 * @param {object|null} [options.headers]
 */
function fetchSomething(url, {
  maxRetries = 0,
  json = true,
  headers = null
} = {}) {
  console.log('fetchSomething>', { url, maxRetries, json, headers });
}
fetchSomething("test.gltf", { maxRetries: 2 });
fetchSomething("test.gltf");
