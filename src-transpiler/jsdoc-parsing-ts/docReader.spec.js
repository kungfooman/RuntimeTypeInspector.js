import {canonicalDocEqual, canonicalDocCovers} from '../jsdoc-parsing-depfree/canonicalDocCompare.js';
import {docReaderDepFree} from '../jsdoc-parsing-depfree/docReaderDepFree.js';
import {docReaderTS} from './docReaderTS.js';

// Every delimited harness input strips to bare tag text, which is the
// readers' shared input shape. Delimiters stay at the call boundary:
// the TS reader wraps them for `createSourceFile`, the depfree reader
// never needs them.
const inputs = [
  '@param {number} x',
  '@param {number} a @param {string} b',
  '@template K @param {K} x',
  '@template [K=string]',
  '@param {Object} [kwargs={}] rest',
  '@param {string} outputs.logits The logits',
  '@param {number} *value',
  '@param {number a',
  '@param {number a @param {string} b',
  '@param {number} a\ncall foo(@param bar) here',
  '@type {number}',
  '@template {string} [K=string]',
  '@overload\n@param {string} text\n@returns {string}\n@overload\n@param {number} value\n@returns {number}',
  '@overload\n@param {number} [x]\n@param {number} [y]',
  '@overload\n@param {string} label\n@param {...number[]} values\n@returns {number}',
  '@overload\n@param {string} label\n@param {...number} values\n@returns {number}',
  '@template {string} T @overload\n@param {T} first\n@param {NoInfer<T>} second\n@returns {T}',
  '@overload\n@param {...number[]} [values]\n@returns {number}',
  '@overload\n@param {number[]} ...values\n@returns {number}',
  '@overload\n@param {string} text\n@returns {string}\n@param {string|number} value\n@returns {string|number}',
  '@template K @template V @param {K} a @param {V} b',
  '@param {string} url\n@param {object} options Opts.\n@param {number} [options.maxRetries] Max.\n@param {boolean} [options.json] Flag.',
  '@callback SwapFunction\n@param {Object} newState - The new state.',
  // A callback with a trailing `@returns` binds the return like the
  // depfree flat row does (the TS signature carries it as its own node,
  // which the reader must surface instead of dropping).
  '@callback HandleEventCallback\n@param {any} [arg1] - First argument.\n@returns {void}',
  // An `@template` nested in a callback tail dies with the TS signature
  // (flat `@template` is order-blind), so the TS reader binds it from
  // the tag source like the depfree row does.
  '@callback G\n@param {T} x\n@template T\n@returns {T}',
  '@callback G\n@template T\n@param {T} x\n@returns {T}',
  '@callback G\n@param {T} x\n@template {string} T\n@returns {T}',
  // A dotted child merges into its container inside the TS signature,
  // so the nested rows un-merge like the flat tail does (container
  // marked, children re-sliced — names and brackets pinned, not text).
  '@callback O\n@param {object} opts\n@param {string} opts.name\n@returns {void}',
  '@callback O\n@param {object} [opts]\n@param {string} [opts.name]\n@returns {void}',
  '@callback A\n@param {number} x\n@callback B\n@param {object} opts\n@param {string} opts.name\n@returns {void}',
  // A leading `~` empties the TS return node, which `recoverTildeTag`
  // declines: the callback form re-slices the raw group whole.
  '@callback T\n@param {number} x\n@returns {~Foo}',
  // An inline callback type carries no name on either side (tsc parses
  // it as the signature type with no binding), never a brace fragment.
  '@callback {function(number): void} Fn',
  // A dotted child merges into its container inside an `@overload`
  // signature too (the playcanvas `script/component.js` `args` shape),
  // so the nested rows un-merge per section like the flat tail does.
  '@overload\n@param {object} [args] - Opts.\n@param {boolean} [args.enabled] - Flag.\n@returns {void}',
  '@overload\n@param {string} a\n@param {object} [args]\n@param {boolean} [args.x]\n@returns {string}\n@overload\n@param {number} b\n@param {object} [args]\n@param {boolean} [args.y]\n@returns {number}',
  // A section-breaking marker terminates the section: the break text
  // belongs to the tail, never to the entry — tsc parses the marker as
  // its own tag. The tail binds flat as the implementation.
  '@overload\n@param {number} x\n@callback Cb\n@param {string} y\n@returns {void}',
  '@overload\n@callback Cb\n@param {number} x\n@returns {void}',
  '@overload\n@param {number} x\n@type {string}',
  // Template position decides the route. A template-first part stalls
  // before any row (empty entry, stranded rows bind flat); a template
  // after rows rode the same marker that holds them (the entry absorbs
  // the whole piece); a pre-marker template is flat scope.
  '@overload\n@template K\n@param {K} a\n@returns {K}',
  '@overload\n@param {T} x\n@template T\n@returns {T}',
  '@overload\n@param {T} x\n@template {string} T\n@returns {T}',
  '@overload\n@param {K} a\n@returns {K}\n@template K',
  '@template K\n@overload\n@param {K} a\n@returns {K}',
  // A swapped head carries the type itself (matter-js spelling): tsc
  // binds the first word as the name and the group past it as the type.
  '@overload\n@param label {string}\n@returns {string}',
  // A tilde in the return re-slices raw when the TS node empties.
  '@overload\n@param {number} x\n@returns {~Foo}',
  '@overload\n@param {number[]} ...values\n@returns {number}',
  '@overload\n@param {string} label\n@param {...number[][]} [values]\n@returns {number}',
];

// One function per input would be 25 near-identical functions; the loop
// keeps the matrix in data while the label names the failing cell, so a
// failure line still points at what broke. The parity harness runs the
// same inputs delimited; this spec runs them bare.
function testReadersAgreeOnInputs() {
  for (const input of inputs) {
    const actual = docReaderDepFree(input);
    const expected = docReaderTS(input);
    if (!canonicalDocEqual(actual, expected) && !canonicalDocCovers(actual, expected)) {
      console.warn('docReader> mismatch for input ' + JSON.stringify(input), {actual, expected});
      return false;
    }
  }
  return true;
}

export const tests = [testReadersAgreeOnInputs];
