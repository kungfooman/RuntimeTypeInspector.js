# Cross context networking

One thin `postMessage` network between contexts (window, worker, iframe, pop-out): addressed envelopes, channel subscriptions, fan-out and coalescing. It knows peers, channels and verbs — nothing else. Every project names its own network tag, its own peer ids and its own channel vocabulary.

## The likeable API

Most projects need exactly one peer:

```js
import {CrossContextBus} from './cross-context/CrossContextBus.js';

const panel = new CrossContextBus({net: 'my-app', id: 'panel'});
const checker = new CrossContextBus({net: 'my-app', id: 'checker'});

// checker side: one call builds, stamps and posts (bare host, closed bus)
checker.send('checks', 'frame', null, {n});

// panel side: subscribe one verb table to a channel, unknown verbs warn
const off = panel.listen(globalThis, 'checks', {
  frame: (envelope) => render(envelope.n),
}, ({verb}) => console.warn('unknown verb, ignoring', {verb}));
// ...later: off();

// panel side answering: broadcast reaches every peer on the channel,
// point to point mail names its recipient and nobody else picks it up
panel.fanout(sources, panel.message('checks', 'set-quality', null, {value: 'high'}));
panel.send('checks', 'ping', 'checker');

// hot loop traffic: count per key, flush one delta per key per turn
checker.note(key);
// ...later, once per turn:
for (const [key, ticks] of checker.drain()) {
  checker.send('checks', 'ticks', null, {key, ticks});
}
```

`message` plus `post` stay for the pieces: build or inspect an envelope first, then send it.
```

No inherited vocabulary: the constructor requires an explicit `net` and `id`, and throws otherwise. Every other word (channels, verbs, peer ids, stamp field) is yours.

## Pieces, when the peer is too much

The peer is a thin consolidation; every step stays importable alone. One file per function, each with its own spec next to it (`*.spec.js`), following the repo's one-function-per-file rule.

- `netEnvelope({net, channel, verb, from, to, payload})` — the envelope. `to: null` broadcasts, a named `to` is point to point.
- `netMatch(event, net, channel, id)` — the shape guard: same net, same channel, addressed to us or broadcast. Missing shapes degrade to false.
- `netListen(host, net, channel, id, verbs, warn)` — subscribe a verb table, get the unsubscribe closure back. Bare hosts degrade into a no-op.
- `netDeliver(event, net, channel, id, verbs, warn)` — the testable half of `netListen`: same match plus warn, no host needed.
- `netPost(fields)` — build, post at the framed parent (else self), never throw. Returns the envelope as posted.
- `netFanout(targets, message)` — one envelope to every known peer; dead sinks drop one by one.
- `isDirectedEvent(event, tag, destination)` — the legacy lane guard behind project bindings.
- `buildEnvelope(tag, action, destination, payload)` — the legacy envelope behind project bindings.
- `stampEnvelope(message, net, id, sourceKey)` and `CrossContextBus#stamp` — attribute mail to the sending peer. Caller stamps always win.
- `resolvePostTarget()` — parent when framed, else self, else undefined in a bare host. Never throws on missing globals.
- `postToTarget(target, ...args)` and `CrossContextBus#post` — post without ever throwing. Extra args ride along.
- `resolveEventTarget(event)` — reply target of an event: `source`, else `srcElement`, else null.
- `fanoutToTargets(targets, message)` and `CrossContextBus#fanout` — one message to every known peer; dead sinks drop one by one.
- `bestEffort(fn)` — run an action, swallow sync throws.
- `noteKey(store, key)` / `takeKeys(store)` and peer `note` / `drain` — count ticks per key, drain one delta per key.
