import {inspectType} from "./inspectType.js";
import {replaceType} from "./replaceType.js";
function inspectTypeWithTemplates(value, expect, loc, name, templates) {
  // console.log("old expect", expect);
  for (const key in templates) {
    expect = replaceType(expect, key, templates[key], console.warn);
  }
  // console.log("new expect", expect);
  const ret = inspectType(value, expect, loc, name);
  // if (ret) {
    // Narrowing string|number down, for instance:
    // templates["T"] = "number";
    // We don't narrow down the possible template type based on first input type here,
    // because after all it could be a union of all types. We can't know that from
    // JS side. However I still like the idea of narrowing it down, so we
    // could at least make it an option... and obviously we also have to integrate
    // the NoInfer intrinsic, but that will be later PR's...
  // }
  return ret;
}
export {inspectTypeWithTemplates};
