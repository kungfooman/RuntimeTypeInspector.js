import {windowedOptions} from "./plugin-windowed/windowedOptions.js";
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
   * When `true` (default), RTI records per call site check statistics:
   * how often each `loc` was validated, how many map window rides and
   * full scans happened, and the wall time scans and top level checks
   * took. The TypePanel shows the rows sorted by scan cost, so the real
   * hotspots (and sensible `mapCheckWindowCap` values) can be found.
   * When `false`, recording turns into an early return and costs
   * nothing but one boolean read per check. Toggleable via the
   * TypePanel checkbox.
   * @type {boolean}
   */
  checkStats: true,
  /**
   * The windowing plugin owns these keys (see
   * `plugin-windowed/windowedOptions.js`): spreading them here keeps
   * them in the literal's inferred shape, so checkJs follows their
   * `@type` annotations in the normal type flow. Panels, workers and
   * `setOptions` keep reading and writing the same `options` object
   * with no changes on their side. The plugin options module imports
   * nothing, so the spread adds no new module cycle.
   */
  ...windowedOptions,
};
import {validators} from "./validators.js";
import {validateMap} from "./validateMap.js";
import {windowedValidateMap} from "./plugin-windowed/windowedValidateMap.js";
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
  // `windowedChecks` is wiring, not branching: opting in installs the
  // windowed map validator through the writable table, opting out
  // restores the pedantic core. Core validators stay policy free.
  if (Object.hasOwn(patch, 'windowedChecks')) {
    validators.validateMap = options.windowedChecks ? windowedValidateMap : validateMap;
  }
  // Same wiring for walk timing: enabling stats after an install-skipping
  // import (stats were off then) installs the timed wrappers now. The
  // import is deferred so this leaf module never cycles back through the
  // installer at load time; disabling needs no work, each wrapper gates
  // on the flag at call time.
  if (patch.checkStats === true) {
    import("./plugin-walk-timers/installWalkTimers.js").then((timers) => timers.installWalkTimers());
  }
}
/**
 * Records the host project version (see `options.projectVersion`).
 * @param {string} version - The version, e.g. from the app's package.json.
 */
function setProjectVersion(version) {
  options.projectVersion = version;
}
export {options, setOptions, setProjectVersion};
