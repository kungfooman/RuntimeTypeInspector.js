import {options} from "../options.js";
/**
 * Fetches the live window cap, floored to a sane positive integer so a
 * panel input or misconfigured `setOptions` cannot stall the doubling
 * scheme with zero or negative caps.
 * @returns {number} Smallest usable cap, at least 1.
 * @example
 * options.mapCheckWindowCap = 64;
 * windowCap(); // 64
 */
function windowCap() {
  return Math.max(1, Math.floor(options.mapCheckWindowCap));
}
export {windowCap};
