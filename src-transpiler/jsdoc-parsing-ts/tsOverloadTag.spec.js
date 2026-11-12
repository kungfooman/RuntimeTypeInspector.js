import {tsOverloadTag} from './tsOverloadTag.js';
// A signature with a return lowers params and return brace text.
function testSignatureLowersParamsAndReturn() {
  const tag = {
    typeExpression: {
      parameters: [{
        name: {getText: () => 'text'},
        isBracketed: false,
        typeExpression: {getText: () => '{string}'},
      }],
      type: {typeExpression: {getText: () => '{string}'}},
    },
  };
  const actual = tsOverloadTag(tag);
  return (
    actual.params.length === 1 &&
    actual.params[0].name === 'text' &&
    actual.returns === 'string'
  );
}
// A signature without a return lowers an empty return, not undefined.
function testMissingReturnLowersEmpty() {
  const tag = {
    typeExpression: {
      parameters: [{
        name: {getText: () => 'x'},
        isBracketed: true,
        typeExpression: {getText: () => '{number}'},
      }],
      type: undefined,
    },
  };
  const actual = tsOverloadTag(tag);
  return (
    actual.params.length === 1 &&
    actual.params[0].bracketed === true &&
    actual.returns === ''
  );
}
// A container row absorbs its dotted children as type text inside the
// signature (the playcanvas `script/component.js` `args` shape), so the
// nested params un-merge like the flat tail: container marked merged,
// children re-sliced with names and brackets pinned instead of text.
// The stub mirrors real node text: the container's `getText` holds the
// whole remaining tail (head plus children), while its typeExpression
// holds the absorbed child rows only, exactly as tsc parses them.
function testDottedContainerUnmerges() {
  const tail = '@param {object} [args]\n@param {boolean} [args.enabled]\n';
  const tag = {
    typeExpression: {
      parameters: [
        {
          name: {getText: () => 'type'},
          isBracketed: false,
          typeExpression: {getText: () => '{new (...args: any[]) => T}'},
          getText: () => '@param {new (...args: any[]) => T} type\n',
        },
        {
          name: {getText: () => 'args'},
          isBracketed: true,
          typeExpression: {getText: () => '@param {boolean} [args.enabled]\n'},
          getText: () => tail,
        },
      ],
      type: {typeExpression: {getText: () => '{T|null}'}},
    },
  };
  const actual = tsOverloadTag(tag);
  return (
    actual.params.length === 3 &&
    actual.params[0].name === 'type' &&
    actual.params[1].name === 'args' &&
    actual.params[1].merged === true &&
    actual.params[2].name === 'args.enabled'
  );
}
// A second overload section keeps its own dotted rows: un-merging is
// per-signature, never leaking children across sections. Stubs mirror
// real node text: tsc merges the children into the container's own
// entry, so each section holds one container text with its own tail.
function testSecondSectionKeepsOwnDottedRows() {
  const ones = tsOverloadTag({
    typeExpression: {
      parameters: [
        {
          name: {getText: () => 'args'},
          isBracketed: true,
          typeExpression: {getText: () => '@param {string} [args.a]\n'},
          getText: () => '@param {object} [args]\n@param {string} [args.a]\n',
        },
      ],
      type: undefined,
    },
  });
  const twos = tsOverloadTag({
    typeExpression: {
      parameters: [
        {
          name: {getText: () => 'args'},
          isBracketed: true,
          typeExpression: {getText: () => '@param {number} [args.b]\n'},
          getText: () => '@param {object} [args]\n@param {number} [args.b]\n',
        },
      ],
      type: undefined,
    },
  });
  return (
    ones.params.some((row) => row.name === 'args.a') === true &&
    ones.params.some((row) => row.name === 'args.b') === false &&
    twos.params.some((row) => row.name === 'args.b') === true &&
    twos.params.some((row) => row.name === 'args.a') === false
  );
}
export const tests = [testSignatureLowersParamsAndReturn, testMissingReturnLowersEmpty, testDottedContainerUnmerges, testSecondSectionKeepsOwnDottedRows];
