/**
 * Stamps one UI bound RTI message with the runtime that checked it,
 * so one panel can attribute rows to the registry that failed them.
 * A caller set source always wins, so tests and forwarders keep theirs.
 * The stamp mutates never: it lands on a copy, so frozen messages post
 * fine and reuse after posting stays safe. No stamp, no copy: mail
 * that needs no stamp (foreign tags, preset sources, non objects)
 * passes back by reference with zero allocation.
 * @param {object} message - The UI bound RTI message.
 * @param {string} runtimeId - Identity of this runtime evaluation.
 * @returns {object} A stamped copy, or the input untouched.
 * @example
 * stampSource({type: 'rti'}, 'abc'); // {type: 'rti', source: 'abc'}
 */
function stampSource(message, runtimeId) {
  if (message === null || message === undefined) {
    return message;
  }
  if (typeof message !== 'object') {
    return message;
  }
  if (Array.isArray(message)) {
    return message;
  }
  if (message.type !== 'rti') {
    return message;
  }
  if (message.source !== undefined) {
    return message;
  }
  const stamped = {
    ...message,
    source: runtimeId,
  };
  return stamped;
}
export {stampSource};
