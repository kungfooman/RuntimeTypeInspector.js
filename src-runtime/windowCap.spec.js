import {options} from './options.js';
import {windowCap} from './windowCap.js';
function testCapPassesThrough() {
  // A sane cap comes back unchanged, so normal tuning just works.
  const virgin = options.mapCheckWindowCap;
  options.mapCheckWindowCap = 64;
  try {
    return windowCap() === 64;
  } finally {
    options.mapCheckWindowCap = virgin;
  }
}
function testCapFloorsAndFloorsAtOne() {
  // Fractional caps floor down, and zero or negative caps floor to 1
  // instead of stalling the doubling scheme.
  const virgin = options.mapCheckWindowCap;
  try {
    options.mapCheckWindowCap = 7.9;
    const floored = windowCap();
    options.mapCheckWindowCap = 0;
    const zeroed = windowCap();
    options.mapCheckWindowCap = -5;
    const negative = windowCap();
    return floored === 7 && zeroed === 1 && negative === 1;
  } finally {
    options.mapCheckWindowCap = virgin;
  }
}
const tests = [
  testCapPassesThrough,
  testCapFloorsAndFloorsAtOne,
];
export {tests};
