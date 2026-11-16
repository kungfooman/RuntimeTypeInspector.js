# Cross context messaging

One thin layer over `postMessage` traffic between contexts (window, worker, iframe): stamped envelopes, lane guards, dispatch, fan-out and coalescing. RTI eats its own cooking here — every message path in the runtime (`inspectType`, `TypePanel`, `Warning`, `pendingRepeats`) calls into this directory — but nothing in the core is RTI specific. Bring your own tag and lane names; the same shapes carry any project's traffic.

## The likeable API

Most projects need exactly one object:

```js
import {CrossContextBus} from './cross-context/CrossContextBus.js';

const bus = new CrossContextBus({tag: 'my-app'});

// checking side: stamp + post, never throws (bare Node, closed worker)
bus.post(bus.message('frame', 'panel', {n}));

// display side: guard, dispatch by action, unknown warns instead of throwing
globalThis.addEventListener?.('message', (event) => {
  bus.dispatch(event, {
    frame: (evt) => render(evt.data.n),
  }, ({action}) => console.warn('unknown action, ignoring', {action}));
});

// display side answering one checker: fan-out skips dead sinks one by one
bus.fanout(sources, bus.message('setQuality', 'checker', {value: 'high'}));

// hot loop traffic: count per key, flush one delta per key per turn
bus.note(key);
// ...later, once per turn:
for (const [key, ticks] of bus.drain()) {
  bus.post(bus.message('ticks', 'panel', {key, ticks}));
}
```

Defaults are RTI's (`tag: 'rti'`, lanes `ui`/`worker`), so RTI code constructs nothing and calls the same layer through its recipe helpers. Other projects pass their own names:

```js
const bus = new CrossContextBus({tag: 'editor', ui: 'panel', worker: 'checker'});
```

## Pieces, when the class is too much

The facade is a thin consolidation; every step stays importable alone. One file per function, each with its own spec next to it (`*.spec.js`), following the repo's one-function-per-file rule.

- `isDirectedEvent(event, tag, destination)` — the shape guard. `isUiEvent`/`isWorkerEvent` are RTI's two calls with `('rti', 'ui'/'worker')` baked in.
- `buildEnvelope(tag, action, destination, payload)` — the envelope. `buildMessage` is RTI's call with `'rti'` baked in.
- `stampSource(message, runtimeId)` and `CrossContextBus#stamp` — attribute traffic to the sending evaluation. Caller stamps always win, so forwarders keep theirs.
- `resolvePostTarget()` — parent when framed, else self, else undefined in bare Node. Never throws on missing globals.
- `postToTarget(target, ...args)` and `CrossContextBus#post` — post without ever throwing. Extra args ride along (transfer lists and friends).
- `resolveEventTarget(event)` — reply target of an event: `source`, else `srcElement`, else null.
- `dispatchUiAction` and `CrossContextBus#dispatch` — dispatch display mail by action from a handler table. Unknown actions warn, never `handler[action] is not a function`.
- `applyWorkerCommand` and `CrossContextBus#apply` — run checker mail against a command table. Unknown stays false so the caller warns once instead of throwing mid dispatch.
- `fanoutToTargets` and `CrossContextBus#fanout` — one message to every known context; dead sinks drop one by one.
- `bestEffort(fn)` — run a reporting action, swallow sync throws.
- `noteKey(store, key)` / `takeKeys(store)` and `bus.note` / `bus.drain` — count ticks per key, drain one delta per key. Never throws on hostile stores.
- RTI recipes on top: `workerSettingMessage`, `breakpointMessage`, `repeatDeltaMessage`, `panelMessageKey`, `repeatTickCount`, `applyRepeatDelta`, `pendingRepeats` (`noteRepeat`/`takeRepeats`/`flushRepeats` on a shared store with microtask scheduling).

## RTI wiring (proof the core holds)

- `src-runtime/crossContextPostMessage.js` — `stampSource` + `resolvePostTarget` + `postToTarget`.
- `src-runtime/inspectType.js` — checker listener via `isWorkerEvent` + `applyWorkerCommand`; reports via `buildMessage` + `breakpointMessage`.
- `src-runtime/TypePanel.js` — panel listener via `isUiEvent`; repeats via `panelMessageKey` + `applyRepeatDelta`; dispatch via `dispatchUiAction`; eight `send*StateToWorker` loops collapsed into `sendSettingToWorkers` over `fanoutToTargets` + `workerSettingMessage`.
- `src-runtime/Warning.js` — breakpoint arm over `postToTarget` + `breakpointMessage`; reply target via `resolveEventTarget`.
- `src-runtime/pendingRepeats.js` — the shared coalescing store over `noteKey` + `takeKeys` + `repeatDeltaMessage`.
- `test_runtime.js` — every helper plus `CrossContextBus` speced; `npm run lint` owns import alignment and brace style.
