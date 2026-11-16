import {bestEffort        } from './bestEffort.js';
import {buildEnvelope     } from './buildEnvelope.js';
import {fanoutToTargets   } from './fanoutToTargets.js';
import {isDirectedEvent   } from './isDirectedEvent.js';
import {noteKey           } from './noteKey.js';
import {postToTarget      } from './postToTarget.js';
import {resolveEventTarget} from './resolveEventTarget.js';
import {resolvePostTarget } from './resolvePostTarget.js';
import {takeKeys          } from './takeKeys.js';
/**
 * One thin bus over `postMessage` traffic between contexts (window,
 * worker, iframe): stamping, posting, listening, replying, fan-out
 * and coalescing in one place. Construct with a tag plus the two lane
 * names (`new CrossContextBus({tag: 'my-app'})` already works), then
 * either call the pieces directly or use the recipe methods. RTI runs
 * the same layer with `{tag: 'rti', ui: 'ui', worker: 'worker'}`, so
 * every RTI message path below stays a thin call into this class.
 * @example
 * const bus = new CrossContextBus({tag: 'my-app'});
 * bus.post({action: 'ping'});
 */
class CrossContextBus {
  /**
   * @param {object} [settings] - Bus settings.
   * @param {string} [settings.tag] - Bus tag stamped on every message.
   * @param {string} [settings.ui] - Lane the display side listens on.
   * @param {string} [settings.worker] - Lane the checking side listens on.
   * @param {string} [settings.sourceKey] - Stamp field, e.g. `source`.
   * @param {string} [settings.runtimeId] - Identity of this evaluation.
   */
  constructor({
    tag = 'rti',
    ui = 'ui',
    worker = 'worker',
    sourceKey = 'source',
    runtimeId,
  } = {}) {
    this.tag = tag;
    this.ui = ui;
    this.worker = worker;
    this.sourceKey = sourceKey;
    this.runtimeId = runtimeId ?? Math.random().toString(36).slice(2, 10);
    /**
     * Coalesced ticks by key: `note` counts, `drain` takes.
     * @type {Map<string, number>}
     */
    this.pendings = new Map();
  }
  /**
   * Builds one envelope on this bus: tag plus destination stay fixed,
   * every payload field rides along untouched.
   * @param {string} action - The action, e.g. `ping`.
   * @param {string} [destination] - The lane, the UI lane by default.
   * @param {object} [payload] - Extra message fields.
   * @returns {object} The message envelope.
   */
  message(action, destination = this.ui, payload = {}) {
    return buildEnvelope(this.tag, action, destination, payload);
  }
  /**
   * Stamps one envelope with this runtime's id, so the display side
   * can attribute rows to the context that sent them. A caller set
   * stamp always wins.
   * @param {object} message - The envelope to stamp.
   * @returns {object} The same message, stamped when it was unstamped.
   */
  stamp(message) {
    if (message === null || message === undefined) {
      return message;
    }
    if (typeof message !== 'object') {
      return message;
    }
    if (message.type !== this.tag) {
      return message;
    }
    if (message[this.sourceKey] !== undefined) {
      return message;
    }
    message[this.sourceKey] = this.runtimeId;
    return message;
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
   * True for display bound traffic on this bus.
   * @param {*} event - The message event.
   * @returns {boolean} True when the event carries display bound mail.
   */
  isDisplay(event) {
    return isDirectedEvent(event, this.tag, this.ui);
  }
  /**
   * True for checker bound traffic on this bus.
   * @param {*} event - The message event.
   * @returns {boolean} True when the event carries checker bound mail.
   */
  isChecker(event) {
    return isDirectedEvent(event, this.tag, this.worker);
  }
  /**
   * Dispatches one display bound message to its handler by action:
   * the handler table maps names to functions, so unknown actions
   * warn instead of throwing and taking down the whole dispatch.
   * @param {*} event - The message event.
   * @param {Map<string, Function>|object} handlers - Action to handler.
   * @param {Function} warn - Called with the unknown action payload.
   * @returns {boolean} True when a handler ran.
   */
  dispatch(event, handlers, warn) {
    if (!this.isDisplay(event)) {
      return false;
    }
    const {action} = event.data ?? {};
    const get = typeof handlers.get === 'function' ? (key) => handlers.get(key) : (key) => handlers[key];
    const handler = get(action);
    if (typeof handler !== 'function') {
      warn({action});
      return false;
    }
    if (typeof handlers.get === 'function') {
      handler(event);
    } else {
      handler.call(handlers, event);
    }
    return true;
  }
  /**
   * Runs one checker bound command table against an event: returns
   * true when a known action applied, false when the caller should
   * warn once instead of throwing mid dispatch.
   * @param {*} event - The message event from the display side.
   * @param {object<string, Function>} commands - Action to command.
   * @returns {boolean} True when a command applied.
   */
  apply(event, commands) {
    if (!this.isChecker(event)) {
      return false;
    }
    const {action} = event.data ?? {};
    const command = commands[action];
    if (typeof command !== 'function') {
      return false;
    }
    command(event.data, event);
    return true;
  }
  /**
   * Resolves the reply target of a display bound message event:
   * `source` for worker and iframe traffic, `srcElement` fallback.
   * @param {*} event - The message event.
   * @returns {*} The reply target, or null when unreachable.
   */
  replyTarget(event) {
    return resolveEventTarget(event);
  }
  /**
   * Fans one checker bound message out to every known context,
   * skipping dead sinks one by one instead of aborting at the
   * first broken bus.
   * @param {Iterable<*>} targets - The event sources to post to.
   * @param {object} message - The message to post to each target.
   * @returns {void}
   */
  fanout(targets, message) {
    fanoutToTargets(targets, message);
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
