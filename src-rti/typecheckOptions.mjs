import { createDiv } from "./createDiv.mjs";
function typecheckReport() {
  console.table(typecheckOptions.warned);
}
/**
 * @param {Object<string, any>} obj - The object to clear.
 */
function clearObject(obj) {
  Object.keys(obj).forEach(_ => delete obj[_]);
}
function typecheckReset() {
  clearObject(typecheckOptions.warned);
}
const typecheckOptions = {
  /**
   * @type {'spam'|'once'} - In spam-mode every message is printed. In once-mode a cache is
   * looked up to check if it was printed already. Spam can be too noisy if there are too
   * many type errors, so the best way to keep it quiet is to fix the noisiest type issues first.
   * Spam-mode basically retains the order, which mentally helps to figure out the actual issues.
   */
  mode: 'spam',
  /**
   * @type {Record<string, { hits: number }>}
   */
  warned: {},
  logSuperfluousProperty: false,
  /**
   * @todo integrate PC/Transformers Examples browser + custom config for each project
   */
  customTypes: {
    AnimSetter(value) {
      //console.log("@todo Is AnimSetter?", value);
      return true;
    },
    AnimBinder(value) {
      //console.log("@todo Is AnimBinder?", value);
      return true;
    },
    AnimCurvePath(value) {
      //console.log("@todo Is AnimCurvePath?", value);
      return true;
    },
    ComponentData(value) {
      //console.log("@todo Is ComponentData?", value);
      return true;
    },
    Renderer(value) {
      // E.g. instance of `ForwardRenderer`
      //debugger;
      return value?.constructor?.name?.endsWith("Renderer");
    },
    IArguments(value) {
      //console.log("@todo Is IArguments?", value);
      return true;
    },
    // @todo validate textures having width != 0 and height != 0
    // @todo validate integers
  },
  div: createDiv(),
  count: 0,
};
export { typecheckReport, clearObject, typecheckReset, typecheckOptions };
