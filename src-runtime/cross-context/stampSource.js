/**
 * Stamps one UI bound RTI message with the runtime that checked it,
 * so one panel can attribute rows to the registry that failed them.
 * A caller set source always wins, so tests and forwarders keep theirs.
 * The stamp mutates in place like the legacy bus: structured clone
 * snapshots the message at post time, so callers must not reuse the
 * object after posting anyway.
 * @param {object} message - The UI bound RTI message.
 * @param {string} runtimeId - Identity of this runtime evaluation.
 * @returns {object} The same message, stamped when it was unstamped RTI mail.
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
  if (message.type !== 'rti') {
    return message;
  }
  if (message.source !== undefined) {
    return message;
  }
  message.source = runtimeId;
  return message;
}
export {stampSource};
