/**
 * The option keys the windowing plugin owns, spread into the shared
 * `options` object by the root `options.js`. Plain data, no imports, so
 * the spread adds no new module cycle: panels, workers and `setOptions`
 * keep reading and writing the same object with no changes on their side.
 */
const windowedOptions = {
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
   * intent is one switch for Set/Array windows when they exist. Rides
   * additionally require the map to have accumulated at least
   * `mapCheckWindowMinTotalMs` of scan time since its content last
   * changed, so maps nobody ever spent real time scanning keep
   * validating every check.
   * @type {boolean}
   */
  windowedChecks: false,
  /**
   * Scan time budget (in milliseconds) a map must accumulate before its
   * checks may ride rescan windows when `windowedChecks` is true: every
   * full scan adds its wall time to the map's running total, and only
   * once the total reaches this budget do checks start skipping. Cheap
   * maps never get there, so they keep validating every check, while a
   * map that already cost real time amortizes from then on. Content
   * changes restart the total (the spend validated the old content),
   * and lowering the budget to `0` restores ride-always behavior.
   * Editable live, like `mapCheckWindowCap`.
   * @type {number}
   */
  mapCheckWindowMinTotalMs: 100,
  /**
   * Largest interval the doubling map rescan scheme may reach when
   * `windowedChecks` is true. A small cap bounds the detection latency
   * for persistent drift (at most one window of checks passes before a
   * rescan reports it) at the price of more frequent scans; a large cap
   * amortizes scan cost further but staleness grows with it. Editable
   * live, so a hotspot found via the panel's check stats can be
   * retuned without a reload. Applies to maps today, like
   * `windowedChecks`.
   * @type {number}
   */
  mapCheckWindowCap: 1024,
};
export {windowedOptions};
