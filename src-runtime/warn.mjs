import {options} from "./options.mjs";
import {Warning} from "./Warning.js";
/**
 * @param {string} msg - The main message.
 * @param {...any} extra - Extra strings or objects etc.
 */
function warn(msg, ...extra) {
  const {mode, warned} = options;
  switch (mode) {
    case 'spam':
      console.error(msg, ...extra);
      break;
    case 'once':
      if (warned[msg].hits === 1) {
        console.error(msg, ...extra);
      }
      break;
    case 'never':
      break;
    default:
      console.error("warn> unsupported mode:", mode);
  }
}
export {warn};
