"insert types and eval";
/**
 * @param {string|object} url - Either the URL of the resource to load or a structure
 * containing the load and original URL.
 * @param {string} [url.load] - The URL to be used for loading the resource.
 * @param {string} [url.original] - The original URL to be used for identifying the resource
 * format. This is necessary when loading, for example from blob.
 * @param {ResourceHandlerCallback} [callback] - The callback used when the resource is loaded or
 * an error occurs.
 * @param {Asset} [asset] - Optional asset that is passed by ResourceLoader.
 */
function load(url, callback, asset) {
}
typecheckReset();
console.clear();
load("...");
//load(123);
load({load: ""});
