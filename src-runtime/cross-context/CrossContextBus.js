import {bestEffort        } from './bestEffort.js';
import {netDeliver        } from './netDeliver.js';
import {netEnvelope       } from './netEnvelope.js';
import {netFanout         } from './netFanout.js';
import {netListen         } from './netListen.js';
import {netMatch          } from './netMatch.js';
import {netPost           } from './netPost.js';
import {noteKey           } from './noteKey.js';
import {resolveEventTarget} from './resolveEventTarget.js';
import {resolvePostTarget } from './resolvePostTarget.js';
import {postToTarget      } from './postToTarget.js';
import {stampEnvelope     } from './stampEnvelope.js';
import {takeKeys          } from './takeKeys.js';
/**
 * One thin peer on a `postMessage` network between contexts (window,
 * worker, iframe): envelope building, stamping, posting, listening,
 * replying, fan-out and coalescing in one place. Every project names
 * its own network tag plus its channel vocabulary and its own peer
 * id — nobody inherits another project's roles.
 * @example
 * const bus = new CrossContextBus({net: 'my-app', id: 'panel'});
 * bus.send('checks', 'frame');
 */
class CrossContextBus {
  /**
   * @param {object} settings - Bus settings, all explicit.
   * @param {string} settings.net - Network tag stamped on every message.
   * @param {string} settings.id - This peer's id on the network.
   * @param {string} [settings.sourceKey] - Stamp field, `from` by default.
   */
  constructor(settings = {}) {
    const {
      net,
      id,
      sourceKey = 'from',
    } = settings;
    if (typeof net !== 'string' || net.length === 0) {
      throw new Error('CrossContextBus> explicit `net` required, e.g. {net: \'my-app\', id: \'panel\'}');
    }
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('CrossContextBus> explicit `id` required');
    }
    this.net = net;
    this.id = id;
    this.sourceKey = sourceKey;
    this.runtimeId = this.id;
    /**
     * Coalesced ticks by key: `note` counts, `drain` takes.
     * @type {Map<string, number>}
     */
    this.pendings = new Map();
  }
  /**
   * Builds one envelope on this net: tag plus sender stay fixed,
   * every payload field rides along untouched. `to` stays null
   * for broadcasts, or names one peer for point to point mail.
   * @param {string} channel - The channel, e.g. `checks`.
   * @param {string} verb - What happened, e.g. `frame`.
   * @param {string|null} [to] - Recipient id, or null to broadcast.
   * @param {object} [payload] - Extra message fields.
   * @returns {object} The network envelope.
   */
  message(channel, verb, to = null, payload = {}) {
    return netEnvelope({
      net: this.net,
      channel,
      verb,
      from: this.id,
      to,
      payload,
    });
  }
  /**
   * Stamps one envelope with this peer's id, so receivers can
   * attribute rows to the context that sent them. A caller set
   * stamp always wins.
   * @param {object} message - The envelope to stamp.
   * @returns {object} The same message, stamped when it was unstamped.
   */
  stamp(message) {
    return stampEnvelope(message, this.net, this.id, this.sourceKey);
  }
  /**
   * Posts one envelope to the cross context target (the embedding
   * parent when framed, otherwise the current scope). Never throws:
   * a missing or broken bus degrades into a lost message.
   * @param {object} message - The envelope to post.
   * @param {...any} rest - Extra arguments riding along untouched.
   * @returns {void}
   */
  post(message, ...rest) {
    postToTarget(resolvePostTarget(), this.stamp(message), ...rest);
  }
  /**
   * Builds, stamps and posts in one call: the likeable path for the
   * common case, where no caller owned envelope needs reposting.
   * `message` plus `post` stay for the pieces (build or inspect first,
   * then send). Returns the envelope as posted for local bookkeeping.
   * @param {string} channel - The channel, e.g. `checks`.
   * @param {string} verb - What happened, e.g. `frame`.
   * @param {string|null} [to] - Recipient id, or null to broadcast.
   * @param {object} [payload] - Extra message fields.
   * @param {...any} rest - Extra arguments riding along untouched.
   * @returns {object} The envelope as posted.
   */
  send(channel, verb, to = null, payload = {}, ...rest) {
    const message = this.message(channel, verb, to, payload);
    this.post(message, ...rest);
    return message;
  }
  /**
   * True when an event is our mail on a channel: same network tag,
   * same channel, addressed to us or broadcast.
   * @param {*} event - The message event.
   * @param {string} channel - The channel to match.
   * @returns {boolean} True when the event is our mail.
   */
  isOurs(event, channel) {
    return netMatch(event, this.net, channel, this.id);
  }
  /**
   * Dispatches one event to its verb handler on a channel: the verb
   * table maps verbs to functions, so unknown verbs warn instead of
   * throwing and taking down the whole dispatch.
   * @param {*} event - The message event.
   * @param {string} channel - The channel to match.
   * @param {Map<string, Function>|object} verbs - Verb to handler.
   * @param {Function} warn - Called with the unknown verb payload.
   * @returns {boolean} True when a handler ran.
   */
  dispatch(event, channel, verbs, warn) {
    return netDeliver(event, this.net, channel, this.id, verbs, warn);
  }
  /**
   * Subscribes one verb table to a channel: every matching event
   * runs its verb handler. Returns the unsubscribe closure, so short
   * lived contexts never leak a listener after teardown.
   * @param {*} host - The bus host carrying `addEventListener`, if any.
   * @param {string} channel - The channel to listen on.
   * @param {Map<string, Function>|object} verbs - Verb to handler.
   * @param {Function} warn - Called with the unknown verb payload.
   * @returns {Function} Unsubscribe closure.
   */
  listen(host, channel, verbs, warn) {
    return netListen(host, this.net, channel, this.id, verbs, warn);
  }
  /**
   * Resolves the reply target of an event: `source` for worker and
   * iframe traffic, `srcElement` fallback.
   * @param {*} event - The message event.
   * @returns {*} The reply target, or null when unreachable.
   */
  replyTarget(event) {
    return resolveEventTarget(event);
  }
  /**
   * Broadcasts one envelope to every known peer, skipping dead
   * sinks one by one instead of aborting at the first broken bus.
   * @param {Iterable<*>} targets - The peer buses to post to.
   * @param {object} message - The envelope to send to each target.
   * @returns {void}
   */
  fanout(targets, message) {
    netFanout(targets, message);
  }
  /**
   * Counts one tick per key for later flushing: hot loop traffic
   * collapses from per event to per key per flush.
   * @param {string} key - The key that ticked.
   * @returns {number} Pending ticks for this key after recording.
   */
  note(key) {
    return noteKey(this.pendings, key);
  }
  /**
   * Drains the pending ticks: each entry carries its key plus how
   * many ticks accumulated since the last flush.
   * @returns {Map<string, number>} Key to tick count.
   */
  drain() {
    return takeKeys(this.pendings);
  }
  /**
   * Runs one best effort action, swallowing sync throws, for fire
   * and forget reporting paths that must never break the sender.
   * @param {Function} fn - The action to run.
   * @returns {void}
   */
  bestEffort(fn) {
    bestEffort(fn);
  }
}
export {CrossContextBus};
