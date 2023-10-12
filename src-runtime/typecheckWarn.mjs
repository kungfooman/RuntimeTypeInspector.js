import {typecheckOptions} from "./typecheckOptions.mjs";
/**
 * @param {string} msg - The main message.
 * @param  {...any} extra - Extra strings or objects etc.
 */
function typecheckWarn(msg, ...extra) {
  const { mode, warned } = typecheckOptions;
  warned[msg] = warned[msg] || { hits: 0 };
  warned[msg].hits++;
  switch (mode) {
    case 'spam':
      console.error(msg, ...extra);
      break;
    case 'once':
      if (warned[msg].hits === 1) {
        console.error(msg, ...extra);
      }
      break;
    default:
      console.error("typecheckWarn> unsupported mode:", mode);
  }
}
export {typecheckWarn};
