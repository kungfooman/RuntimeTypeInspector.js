import {ts2js} from '../src-transpiler/ts2js.js';
/**
 * @typedef {Object} TSTestCase
 * @property {string} input - TypeScript code.
 * @property {string} output - Expected JavaScript + JSDoc output.
 */
/** @type {TSTestCase[]} */
const tests = [
  {
    input: `
export function sum(nums: number[], opts?: {start?: number}): number {
  return nums.reduce((a, b) => a + b, opts?.start ?? 0);
}`,
    output: `
/**
 * @param {number[]} nums
 * @param {{start?: number}} [opts]
 * @returns {number}
 */ export function sum(nums, opts) {
  return nums.reduce((a, b) => a + b, opts?.start ?? 0);
}`,
  },
  {
    input: `
export interface Person {
  name: string;
  age?: number;
}`,
    output: `
/**
 * @typedef {Object} Person
 * @property {string} name
 * @property {number} [age]
 */`,
  },
  {
    input: `
export type Magic = string | number;
`,
    output: `
/**
 * @typedef {string|number} Magic
 */`,
  },
  {
    input: `
export enum Status { New, InProgress = 2, Done }
`,
    output: `
export const Status = {
  New: 0,
  InProgress: 2,
  Done: 3
};`,
  },
  {
    input: `
export class Counter {
  label: string;
  count: number = 0;
  constructor(public label: string, private readonly base: number = 0) {
  }
}`,
    output: `
export class Counter {
  /**
   * @type {string}
   */
  label;
  /**
   * @type {number}
   */
  count = 0;
  /**
   * @param {string} label
   * @param {number} [base = 0]
   */
  constructor(label, base = 0) {
    this.base = base;
    this.label = label;
  }
}`,
  },
  {
    input: `
class Thing {
  private _v: number = 0;
  set value(v: number) { this._v = v; }
  get value(): number { return this._v; }
}`,
    output: `
class Thing {
  /**
   * @type {number}
   */
  _v = 0;
  /**
   * @param {number} v
   */
  set value(v) {
    this._v = v;
  }
  /**
   * @returns {number}
   */
  get value() {
    return this._v;
  }
}`,
  },
  {
    input: `
import type {OnlyType} from './types';
import {Value, type AlsoType} from './vals';
export type {OnlyType};
export {Value, type AlsoType} from './vals';
import Default, {Named} from './mix';
`,
    output: `
/** @import { OnlyType } from './types.js' */
/** @import { AlsoType } from './vals.js' */
import {Value} from './vals';

export {Value} from './vals';

import Default, {Named} from './mix';
`,
  },
  {
    input: `
import type Foo from './foo';
import type * as lib from '../lib';
import type {X} from './x.ts';
import type {Lodash} from 'lodash';
`,
    output: `
/** @import Foo from './foo.js' */
/** @import * as lib from '../lib.js' */
/** @import { X } from './x.js' */
/** @import { Lodash } from 'lodash' */
`,
  },
  {
    input: `
declare function externalThing(x: number): void;
declare const globalVal: number;
const castValue = globalVal as unknown as string;
const n = castValue!;
`,
    output: `
const castValue = globalVal;
const n = castValue;
`,
  },
  {
    input: `
export function mapValues<K, V>(map: Map<K, V>): V[] {
  return Array.from(map.values());
}`,
    output: `
/**
 * @template {K} K
 * @template {V} V
 * @param {Map<K, V>} map
 * @returns {V[]}
 */ export function mapValues(map) {
  return Array.from(map.values());
}`,
  },
  {
    input: `
export function regress(x: number | null, ys?: [number, number], ...rest: string[]): string {
  return JSON.stringify([x, ys, rest]);
}`,
    output: `
/**
 * @param {number|null} x
 * @param {[number, number]} [ys]
 * @param {...string} rest
 * @returns {string}
 */ export function regress(x, ys, ...rest) {
  return JSON.stringify([x, ys, rest]);
}`,
  },
  {
    input: `
export function loadFrom(fn: (a: string) => number) {
  return fn('x');
}`,
    output: `
/**
 * @param {(a: string) => number} fn
 */ export function loadFrom(fn) {
  return fn('x');
}`,
  },
  {
    input: `
export function greet(name: string, greeting = 'hello', times = 2) {
  return name + greeting.repeat(times);
}`,
    output: `
/**
 * @param {string} name
 * @param {string} [greeting = 'hello']
 * @param {number} [times = 2]
 */ export function greet(name, greeting = 'hello', times = 2) {
  return name + greeting.repeat(times);
}`,
  },
  {
    input: `
namespace MyLib {
  export const version = '1.0';
}
`,
    output: `
// ts2js: namespace 'MyLib' is dropped (not supported yet)
`,
  },
  {
    input: `
function render(name: string) {
  const el = <div className="x">{name}</div>;
  return el;
}`,
    output: `
import {createElement} from 'react';
/**
 * @param {string} name
 */
function render(name) {
  const el = createElement(
    "div",
    {
      className: "x",
    },
    name,
  );
  return el;
}`,
  },
  {
    input: `
export class Foo {
  constructor(public x: number) {
    console.log('constructed');
  }
}`,
    output: `
export class Foo {
  /**
   * @param {number} x
   */
  constructor(x) {
    this.x = x;
    console.log('constructed');
  }
}`,
  },
];
/**
 * @param {string} a - Left source code.
 * @param {string} b - Right source code.
 * @returns {string[][]} The differing lines.
 */
function compareLineByLine(a, b) {
  const a_ = a.split('\n');
  const b_ = b.split('\n');
  const t = [];
  for (let i = 0; i < a_.length; i++) {
    const lineA = a_[i];
    const lineB = b_[i];
    if (lineA !== lineB) {
      t.push([`Line ${i}`, lineA, lineB]);
    }
  }
  return t;
}
/**
 * @param {string} input - Source code to normalize.
 * @returns {string} Normalized output.
 */
function normalize(input) {
  let output = input.replace(/\n+/g, '\n').trim();
  output = output
    .split('\n')
    .filter(_ => _.trim().length)
    .map(_ => _.trim())
    .join('\n');
  return output;
}
let discrepancies = 0;
for (const {input, output} of tests) {
  const actual = ts2js(input);
  if (normalize(actual) !== normalize(output)) {
    discrepancies++;
    console.error('Discrepancy detected in ts2js test:', {input});
    console.table(compareLineByLine(normalize(output), normalize(actual)));
  }
}
if (discrepancies) {
  console.error(`Found ${discrepancies} discrepancies in ${tests.length} ts2js tests`);
} else {
  console.log(`ALL ${tests.length} ts2js tests passed.`);
}
process.exit(discrepancies);