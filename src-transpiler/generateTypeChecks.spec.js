import {runChecks} from './runChecks.js';
function testMismatchedParamSkips() {
  // A JSDoc `@param` naming nothing declared must not emit a reference to
  // it: the generated code would throw ReferenceError at runtime. The
  // check is skipped with a warning instead (tsc reports these as TS8024).
  const src = `/** @param {string} name - Wrong name. */
    function takeMismatchParam(type) {
      return type;
    }
    takeMismatchParam("x");`;
  return runChecks(src, 'takeMismatchParam', (scope, {hits, posted}) => typeof scope.takeMismatchParam === 'function' && hits.length === 0 && posted.length === 0);
}
function testOverloadDocblockMismatchSkips() {
  // An `@overload` block whose `@param` names miss the implementation
  // parameters skips the same way: no crashing reference is emitted.
  const src = `/**
     * @overload
     * @param {string} name - The script name.
     */
    function takeOverloadMismatch(type) {
      return type;
    }
    takeOverloadMismatch("x");`;
  return runChecks(src, 'takeOverloadMismatch', (scope, {hits, posted}) => typeof scope.takeOverloadMismatch === 'function' && hits.length === 0 && posted.length === 0);
}
function testMatchingParamStillChecks() {
  // Control: a correctly named `@param` still validates and reports.
  const src = `/** @param {number} x - The value. */
    function takeMismatchControl(x) {
      return x;
    }
    takeMismatchControl("s");`;
  return runChecks(src, 'takeMismatchControl', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
}
function testRestBindingStillChecks() {
  // `...rest` declares its binding: a matching JSDoc name emits the
  // check instead of skipping it as a mismatch.
  const passingSrc = `/** @param {...any} rest - R. */
    function takeRestPass(...rest) {
      return rest;
    }
    takeRestPass(1, 2);`;
  const passing = runChecks(passingSrc, 'takeRestPass', (scope, {hits, posted}) => typeof scope.takeRestPass === 'function' && hits.length === 0 && posted.length === 0);
  const failingSrc = `/** @param {...number} rest - R. */
    function takeRestFail(...rest) {
      return rest;
    }
    takeRestFail(1, "x");`;
  const failing = runChecks(failingSrc, 'takeRestFail', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
  return passing && failing;
}

// Arrow overloads use actual call arguments while the body keeps lexical arguments.
function testOverloadedArrowLexicalArguments() {
  const src = `function outer(marker) {
    /**
     * @overload
     * @param {number} value
     * @returns {string}
     */
    /** @param {number} value */
    const arrow = (value = 1) => arguments[0] + value;
    arrow(2, 3);
    return arrow();
  }
  const result = outer('marker');`;
  return runChecks(src, 'result', (scope, {hits}) => (
    scope.result === 'marker1' && hits.length === 2
  ));
}

// Suppression names the implementation parameter even when overload names differ.
function testOverloadedScopedIgnoreUsesPosition() {
  const src = `/**
     * @overload
     * @param {number} renamed
     * @param {string} other
     * @returns {void}
     */
    /**
     * @param {number} value
     * @param {string} other
     * @ignoreRTI value
     */
    function takeIgnoredOverload(value, other) {}
    takeIgnoredOverload('ignored', 'ok');
    takeIgnoredOverload('ignored', 3);`;
  return runChecks(src, 'takeIgnoredOverload', (scope, {hits}) => hits.length === 1);
}

// A parameter named Array cannot shadow the argument-list conversion.
function testOverloadParameterNamedArray() {
  const src = `/**
     * @overload
     * @param {number} value
     * @returns {number}
     */
    /** @param {number} Array */
    function takeArrayNamedParam(Array) { return Array; }
    takeArrayNamedParam(1);
    takeArrayNamedParam('bad');`;
  return runChecks(src, 'takeArrayNamedParam', (scope, {hits}) => hits.length === 1);
}

// A named arrow keeps its length, inferred name, and actual argument list.
function testOverloadedArrowMetadata() {
  const src = `/**
     * @overload
     * @param {number} first
     * @param {number} [second]
     * @returns {number}
     */
    /** @param {number} first @param {number} [second] */
    const measured = (first, second = 1) => first + second;
    measured(2);
    measured(2, undefined);
    measured(2, 3, 4);`;
  return runChecks(src, 'measured', (scope, {hits, posted}) => (
    scope.measured.length === 1 &&
    scope.measured.name === 'measured' &&
    hits.length === 1 &&
    posted[0].value.length === 3
  ));
}

// An object property arrow retains its inferred property name and arity.
function testOverloadedPropertyArrowMetadata() {
  const src = `const container = {
    /** @overload @param {number} value @returns {number} */
    /** @param {number} value */
    action: (value) => value
  };
  container.action('bad');`;
  return runChecks(src, 'container', (scope, {hits}) => (
    scope.container.action.length === 1 &&
    scope.container.action.name === 'action' &&
    hits.length === 1
  ));
}

// An async arrow keeps its metadata even when the surrounding scope shadows Object.
function testOverloadedAsyncArrowMetadata() {
  const src = `const Object = null;
  /** @overload @param {number} value @returns {Promise<number>} */
  /** @param {number} value */
  const asyncAction = async (value) => value;`;
  return runChecks(src, 'asyncAction', (scope) => (
    scope.asyncAction.length === 1 &&
    scope.asyncAction.name === 'asyncAction' &&
    scope.asyncAction.constructor.name === 'AsyncFunction'
  ));
}

// Computed keys are coerced once in order, including symbols and nearby properties.
function testOverloadedComputedPropertyMetadata() {
  const src = `const events = [];
  const symbol = Symbol('action');
  const key = {
    [Symbol.toPrimitive](hint) {
      events.push(hint);
      return symbol;
    }
  };
  const holder = {
    before: events.push('before'),
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [key]: (value) => value,
    after: events.push('after')
  };
  holder[symbol]('bad');`;
  return runChecks(src, 'events, holder, symbol', (scope, {hits}) => {
    const fn = scope.holder[scope.symbol];
    const descriptor = Object.getOwnPropertyDescriptor(scope.holder, scope.symbol);
    return (
      scope.events.join(',') === 'before,string,after' &&
      fn.length === 1 &&
      fn.name === '[action]' &&
      descriptor.enumerable === true &&
      descriptor.writable === true &&
      descriptor.configurable === true &&
      hits.length === 1
    );
  });
}

// A yielded key remains in the generator, rather than a generated arrow scope.
function testOverloadedYieldedPropertyKey() {
  const src = `function* makeHolder() {
    return {
      /** @overload @param {number} value @returns {number} */
      /** @param {number|string} value */
      [yield 'key']: (value) => value
    };
  }`;
  return runChecks(src, 'makeHolder', (scope) => {
    const iterator = scope.makeHolder();
    const first = iterator.next();
    const second = iterator.next('action');
    return (
      first.value === 'key' &&
      first.done === false &&
      second.done === true &&
      second.value.action.length === 1 &&
      second.value.action.name === 'action'
    );
  });
}

// Reentrant key coercion and a same-named outer binding keep independent keys.
function testOverloadedReentrantComputedKeys() {
  const src = `const rtiOverloadKey = 7;
  let inner;
  const key = {
    toString() {
      const innerKey = 'nested';
      inner = {
        /** @overload @param {number} value @returns {number} */
        /** @param {number} value */
        [innerKey]: (value) => value + rtiOverloadKey
      };
      return 'outer';
    }
  };
  const outer = {
    /** @overload @param {number} value @returns {number} */
    /** @param {number} value */
    [key]: (value) => value + rtiOverloadKey
  };`;
  return runChecks(src, 'inner, outer', (scope, {hits}) => {
    const nested = scope.inner.nested;
    const outer = scope.outer.outer;
    return (
      nested(1) === 8 &&
      outer(2) === 9 &&
      nested.name === 'nested' &&
      outer.name === 'outer' &&
      nested.length === 1 &&
      outer.length === 1 &&
      hits.length === 0
    );
  });
}

// A computed proto key remains an own data property, not a prototype setter.
function testOverloadedComputedProtoKey() {
  const src = `const key = '__proto__';
  const holder = {
    /** @overload @param {number} value @returns {number} */
    /** @param {number} value */
    [key]: (value) => value
  };`;
  return runChecks(src, 'holder', (scope) => {
    const descriptor = Object.getOwnPropertyDescriptor(scope.holder, '__proto__');
    return (
      Object.getPrototypeOf(scope.holder) === Object.prototype &&
      descriptor.value.name === '__proto__' &&
      descriptor.value.length === 1
    );
  });
}

// The inserted key scope keeps the enclosing method's super, this, and arguments.
function testOverloadedComputedLexicalBindings() {
  const src = `class Base {
    read() { return this.offset; }
  }
  class Derived extends Base {
    constructor() { super(); this.offset = 4; }
    make(key) {
      return {
        /** @overload @param {number} value @returns {number} */
        /** @param {number} value */
        [key]: (value) => super.read() + value + arguments[0].length
      };
    }
  }
  const holder = new Derived().make('run');`;
  return runChecks(src, 'holder', (scope, {hits}) => {
    const action = scope.holder.run;
    return (
      action(2) === 9 &&
      action.length === 1 &&
      action.name === 'run' &&
      hits.length === 0
    );
  });
}

// Named and private class field arrows keep their metadata and report their owning class.
function testOverloadedNamedClassFields() {
  const src = `class Holder {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    action = (value) => value;
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    static action = (value) => value;
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    #privateAction = (value) => value;
    getPrivateAction() { return this.#privateAction; }
  }
  const holder = new Holder();
  holder.action('bad');
  Holder.action('bad');
  holder.getPrivateAction()('bad');`;
  return runChecks(src, 'Holder, holder', (scope, {hits, posted}) => {
    const instance = scope.holder.action;
    const staticAction = scope.Holder.action;
    const privateAction = scope.holder.getPrivateAction();
    return (
      instance.length === 1 && instance.name === 'action' &&
      staticAction.length === 1 && staticAction.name === 'action' &&
      privateAction.length === 1 && privateAction.name === '#privateAction' &&
      hits.length === 3 && posted.length === 3 &&
      posted[0].loc === 'Holder#action' &&
      posted[1].loc === 'Holder.action' &&
      posted[2].loc === 'Holder##privateAction'
    );
  });
}

// Computed class keys are evaluated once per class, even when class creation reenters.
function testOverloadedComputedClassFieldChecks() {
  const src = `const symbol = Symbol('inner');
  let inner;
  let reads = 0;
  function make(key) {
    return class {
      /** @overload @param {number} value @returns {number} */
      /** @param {number|string} value */
      [key] = (value) => typeof value === 'number' ? value : 0;
    };
  }
  const key = {
    toString() {
      reads++;
      inner = make(symbol);
      return 'outer';
    }
  };
  const Outer = make(key);
  const outer = new Outer();
  const nested = new inner();
  outer.outer('bad');
  nested[symbol]('bad');`;
  return runChecks(src, 'outer, nested, reads, symbol', (scope, {hits}) => (
    scope.reads === 1 &&
    scope.outer.outer.name === 'outer' &&
    scope.nested[scope.symbol].name === '[inner]' &&
    scope.outer.outer(3) === 3 &&
    scope.nested[scope.symbol](4) === 4 &&
    hits.length === 2
  ));
}

export const tests = [
  testMismatchedParamSkips,
  testOverloadDocblockMismatchSkips,
  testMatchingParamStillChecks,
  testRestBindingStillChecks,
  testOverloadedArrowLexicalArguments,
  testOverloadedScopedIgnoreUsesPosition,
  testOverloadParameterNamedArray,
  testOverloadedArrowMetadata,
  testOverloadedPropertyArrowMetadata,
  testOverloadedAsyncArrowMetadata,
  testOverloadedComputedPropertyMetadata,
  testOverloadedYieldedPropertyKey,
  testOverloadedReentrantComputedKeys,
  testOverloadedComputedProtoKey,
  testOverloadedComputedLexicalBindings,
  testOverloadedNamedClassFields,
  testOverloadedComputedClassFieldChecks,
];
