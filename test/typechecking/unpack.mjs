/**
 * @template T
 * @typedef {{
 *   [K in keyof T]: T[K] extends object ? Unpack<T[K]> : T[K]
 * }} Unpack
 */
