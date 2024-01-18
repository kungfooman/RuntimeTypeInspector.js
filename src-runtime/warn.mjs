import {options} from "./options.mjs";
/**
 * @param {import('./Warning.js').Warning} warning - The warning.
 * @param {string} msg - The main message.
 * @param {...any} extra - Extra strings or objects etc.
 */
function warn(warning, msg, ...extra) {
  const {mode} = options;
  switch (mode) {
    case 'spam':
      console.error(msg, ...extra);
      break;
    case 'once':
      if (warning.hits === 1) {
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
