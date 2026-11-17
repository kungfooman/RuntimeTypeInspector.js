import {CrossContextBus} from '../cross-context/CrossContextBus.js';
/**
 * RTI's binding of the generic net: own tag, own peer id, own stamp.
 * Lives here instead of next to the class, so the network module
 * stays free of any one project's vocabulary.
 * @param {string} [id] - Identity of this runtime evaluation.
 * @returns {CrossContextBus} RTI bound peer.
 * @example rtiBus('abc').message('ui', 'addError') // {net: 'rti', ...}
 */
function rtiBus(id) {
  return new CrossContextBus({
    net: 'rti',
    id,
  });
}
export {rtiBus};
