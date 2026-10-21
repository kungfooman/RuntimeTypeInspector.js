import {options} from '../options.js';
import {minTotalMs} from './minTotalMs.js';
function testBudgetPassesThrough() {
  // A positive budget comes back unchanged, so normal tuning just works.
  const virgin = options.mapCheckWindowMinTotalMs;
  options.mapCheckWindowMinTotalMs = 100;
  try {
    return minTotalMs() === 100;
  } finally {
    options.mapCheckWindowMinTotalMs = virgin;
  }
}
function testGarbageDegradesToZero() {
  // NaN and negative budgets degrade to 0 (no budget) instead of
  // turning windowing back into pedantic scanning: the budget is an
  // optimization knob, not a safety latch.
  const virgin = options.mapCheckWindowMinTotalMs;
  try {
    options.mapCheckWindowMinTotalMs = NaN;
    const nanResult = minTotalMs();
    options.mapCheckWindowMinTotalMs = -5;
    const negativeResult = minTotalMs();
    return nanResult === 0 && negativeResult === 0;
  } finally {
    options.mapCheckWindowMinTotalMs = virgin;
  }
}
const tests = [
  testBudgetPassesThrough,
  testGarbageDegradesToZero,
];
export {tests};
