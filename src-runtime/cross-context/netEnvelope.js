/**
 * Builds one network envelope: who sent it, who should get it, on
 * which channel, plus what happened (the verb). `to` stays `null`
 * for broadcasts every listener on the channel receives; point to
 * point mail names its peer instead. Payload rides along untouched.
 * @param {object} fields - Envelope fields.
 * @param {string} fields.net - Network tag, e.g. `my-app`.
 * @param {string} fields.channel - Channel, e.g. `checks`.
 * @param {string} fields.verb - What happened, e.g. `frame`.
 * @param {string} fields.from - Sender id, e.g. this evaluation's id.
 * @param {string|null} [fields.to] - Recipient id, or null to broadcast.
 * @param {object} [fields.payload] - Extra message fields.
 * @returns {object} The network envelope.
 * @example netEnvelope({net: 'my-app', channel: 'checks', verb: 'frame', from: 'a'}) // {net: 'my-app', ...}
 */
function netEnvelope({
  net,
  channel,
  verb,
  from,
  to = null,
  payload = {},
}) {
  return {
    net,
    channel,
    verb,
    from,
    to,
    ...payload,
  };
}
export {netEnvelope};
