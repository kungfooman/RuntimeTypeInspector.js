import {options} from "../options.js";
/**
 * Fetches the live scan spend budget (see
 * `options.mapCheckWindowMinTotalMs`), where an unusable value (NaN or
 * negative, possible only through direct `options` writes since the
 * panel and worker guards reject both) degrades to `0`, no budget. The
 * budget is an optimization knob, not a safety latch, so garbage must
 * keep windowing working instead of silently turning it back into 100%
 * pedantic scanning.
 * @returns {number} Accumulated scan milliseconds that unlock rides, 0 when unset or unusable.
 * @example
 * options.mapCheckWindowMinTotalMs = 100;
 * minTotalMs(); // 100
 */
function minTotalMs() {
  const v = options.mapCheckWindowMinTotalMs;
  return Number.isFinite(v) && v > 0 ? v : 0;
}
export {minTotalMs};
