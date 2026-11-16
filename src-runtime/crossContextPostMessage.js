import {options          } from './options.js';
import {resolvePostTarget} from './cross-context/resolvePostTarget.js';
import {stampSource      } from './cross-context/stampSource.js';
import {postToTarget     } from './cross-context/postToTarget.js';
/**
 * Works to post messages from inside <iframe>'s and Workers to the parent window,
 * which should be the user interface that can handle/display the messages in an
 * integrated matter. Every `type: 'rti'` message carries this evaluation's
 * `source` id (see `options.runtimeId`), so one panel can attribute rows to
 * the runtime that checked them instead of blending registries silently.
 * A caller-set `source` always wins, so tests and forwarders keep theirs.
 * A missing bus (bare Node) or a broken bus (closed worker) stays silent:
 * reporting must never break the check it reports.
 * @param {...any} args - The arguments.
 */
function crossContextPostMessage(...args) {
  const [first] = args;
  stampSource(first, options.runtimeId);
  postToTarget(resolvePostTarget(), ...args);
}
export {crossContextPostMessage};
