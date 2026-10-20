import {windowedOptions} from './windowedOptions.js';
import {options} from '../options.js';
function testWindowedOptionsDefaults() {
  // The plugin owns three keys with pedantic defaults: windowing off,
  // a 100ms spend budget, a 1024 check cap. Any drift here changes
  // shipped behavior, so the defaults are pinned, not just the shapes.
  return windowedOptions.windowedChecks === false &&
    windowedOptions.mapCheckWindowMinTotalMs === 100 &&
    windowedOptions.mapCheckWindowCap === 1024;
}
function testWindowedOptionsSplicedIntoSharedObject() {
  // The root `options.js` splices this object into the shared options,
  // so panels and workers read the same object. If the splice is
  // missing, the keys are absent from `options` and `setOptions` would
  // reject them as unknown.
  return options.windowedChecks === false &&
    options.mapCheckWindowMinTotalMs === 100 &&
    options.mapCheckWindowCap === 1024;
}
const tests = [
  testWindowedOptionsDefaults,
  testWindowedOptionsSplicedIntoSharedObject,
];
export {tests};
