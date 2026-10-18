/**
 * @todo Move everything into TypePanel, since every panel/worker should have its own controls.
 */
const options = {
  enabled: true,
  /**
   * @type {'spam'|'once'|'never'} - In spam-mode every message is printed. In once-mode a cache is
   * looked up to check if it was printed already. Spam can be too noisy if there are too
   * many type errors, so the best way to keep it quiet is to fix the noisiest type issues first.
   * Spam-mode basically retains the order, which mentally helps to figure out the actual issues.
   */
  mode: 'once',
  logSuperfluousProperty: false,
  count: 0,
  /**
   * Matches TypeScript `strictNullChecks`: when `true` (default), `null` and
   * `undefined` only pass optional/nullable types. When `false`, they pass
   * every type, so dammed-up `SomeType`-but-actually-nullable noise stops
   * hiding the real errors. Toggleable via the TypePanel checkbox.
   */
  strictNullChecks: true,
  /**
   * When `true` (default), `+-Infinity` fails `number` validation, catching
   * `NaN` precursors like `Infinity - Infinity`. When `false`, infinities
   * pass `number`. `NaN` always fails. Toggleable via the TypePanel checkbox.
   */
  checkInfinity: true,
  /**
   * When `true` (default), object keys outside the expected shape fail with
   * an excess-property error, so `Omit`/`Pick` actually reject. Strictly
   * speaking this exceeds tsc, whose excess check only fires for fresh
   * literals (wider variables pass) — runtime values carry no such
   * provenance. Disable per project if wide-variable passing must stay
   * quiet. Toggleable via the TypePanel checkbox.
   */
  exactObjects: true,
  /**
   * Corner (or center) where a fresh panel docks: `'bottom-right'`
   * (default), `'bottom-left'`, `'top-right'`, `'top-left'`, `'center'`.
   * A persisted drag position wins over it. Settable via the TypePanel
   * settings menu or `localStorage` (`rti-panel-position`) before load.
   * @type {'bottom-right'|'bottom-left'|'top-right'|'top-left'|'center'}
   */
  panelPosition: 'bottom-right',
  /**
   * Host project version for log headers (`Download log` meta), e.g.
   * `"1.2.3"`. Set via the `projectVersion` option of the bundler plugins
   * (rollup/webpack loaders funnel it into the emitted header) or by
   * calling `setProjectVersion` directly. Stays `null` when unset — the log
   * then says so, nudging toward setting it.
   * @type {string|null}
   */
  projectVersion: null,
  /**
   * When `false` (default), every check of a `Map` argument scans the
   * entire map: 100% pedantic, no check can hide anything between
   * checks. When `true`, repeated checks of the same unchanged map ride
   * doubling rescan windows: the first check scans everything, further
   * checks ride the current interval, the interval doubles on every
   * clean full scan and it restarts on size changes and failing scans
   * (up to a cap of 1024 checks). This trades detection latency for
   * throughput: persistent content mutations (stored value edits or
   * foreign uninstrumented writes) stay unreported for at most one
   * window, and false positives stay impossible. Consumers that
   * revalidate an unchanged map per call (streaming loads like the
   * PlayCanvas GSplat world state) opt in via
   * `setOptions({windowedChecks: true})`. Applies to maps today; the
   * intent is one switch for Set/Array windows when they exist.
   * @type {boolean}
   */
  windowedChecks: false,
};
/**
 * Patches RTI's runtime options from a consumer (engine bootstrap, app
 * config). Unknown keys throw, so a typo'd option name cannot pretend
 * it was applied, and values must match the current option types.
 * @param {Record<string, boolean>} patch - Options to set, e.g. `{windowedChecks: true}`.
 */
function setOptions(patch) {
  for (const key in patch) {
    if (!Object.hasOwn(options, key)) {
      throw new Error(`setOptions> unknown option '${key}'`);
    }
    if (typeof options[key] !== typeof patch[key]) {
      throw new Error(`setOptions> option '${key}' expects a value of type ${typeof options[key]}, got a ${typeof patch[key]}`);
    }
  }
  Object.assign(options, patch);
}
/**
 * Records the host project version (see `options.projectVersion`).
 * @param {string} version - The version, e.g. from the app's package.json.
 */
function setProjectVersion(version) {
  options.projectVersion = version;
}
export {options, setOptions, setProjectVersion};
