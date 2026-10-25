
/**
 * Tagged parameter/atom shapes: template refs substitute through the new
 * `paramType`/`atomType` slots on every nesting path. Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only if
 * each directive is consumed and nothing else errors; `*-errors.json` pins
 * the same sequence for RTI.
 */

/**
 * @template [K=string]
 * @param {K} bare - Bare occurrence pins.
 * @param {K[]} inArray - Ref in array element.
 * @param {{v: K}} inObject - Ref in object prop.
 * @param {(x: K) => K} inFn - Ref in function params and return.
 * @param {new (x: K) => any} inNew - Ref in constructor param.
 * @param {{[k: string]: K}} inIndex - Ref in index signature value.
 * @param {[K, K?]} inTuple - Ref in tuple, one optional member.
 * @param {K | number} inUnion - Ref in union member.
 * @param {Map<string, K>} inMap - Ref in map value.
 * @param {Set<K>} inSet - Ref in set element.
 * @param {Record<string, K>} inRecord - Ref in record value.
 * @returns {K} Pinned bare value.
 */
export function taggedShapes(bare, inArray, inObject, inFn, inNew, inIndex, inTuple, inUnion, inMap, inSet, inRecord) {
  const rtiTemplates = {
    "K": "string"
  };
  if (!inspectTypeWithTemplates(bare, "K", 'taggedShapes', 'bare', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inArray, {
    "type": "array",
    "elementType": "K",
    "optional": false
  }, 'taggedShapes', 'inArray', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inObject, {
    "type": "object",
    "properties": {
      "v": "K"
    },
    "optional": false
  }, 'taggedShapes', 'inObject', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inFn, {
    "type": "function",
    "parameters": [
      {
        "type": "parameter",
        "paramType": "K",
        "name": "x"
      }
    ],
    "optional": false
  }, 'taggedShapes', 'inFn', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inNew, {
    "type": "new",
    "parameters": [
      {
        "type": "parameter",
        "paramType": "K",
        "name": "x"
      }
    ],
    "ret": "any",
    "optional": false
  }, 'taggedShapes', 'inNew', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inIndex, {
    "type": "object",
    "indexSignatures": [
      {
        "type": "indexSignature",
        "indexType": "K",
        "indexParameters": [
          {
            "type": "parameter",
            "paramType": "string",
            "name": "k"
          }
        ]
      }
    ],
    "optional": false
  }, 'taggedShapes', 'inIndex', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inTuple, {
    "type": "tuple",
    "elements": [
      "K",
      {
        "type": "tupleMember",
        "name": "",
        "elementType": "K",
        "optional": true
      }
    ],
    "optional": false
  }, 'taggedShapes', 'inTuple', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inUnion, {
    "type": "union",
    "members": [
      "K",
      "number"
    ],
    "optional": false
  }, 'taggedShapes', 'inUnion', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inMap, {
    "type": "map",
    "key": "string",
    "val": "K",
    "optional": false
  }, 'taggedShapes', 'inMap', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inSet, {
    "type": "set",
    "elementType": "K",
    "optional": false
  }, 'taggedShapes', 'inSet', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(inRecord, {
    "type": "record",
    "key": "string",
    "val": "K",
    "optional": false
  }, 'taggedShapes', 'inRecord', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return bare;
}
class TakesString {
  
  /**
   * @param {string} x - Value.
   */
  constructor(x) {
    if (!inspectType(x, "string", 'TakesString#constructor', 'x')) {
      youCanAddABreakpointHere();
    }
    this.x = x;
  }
}
registerClass(TakesString);

/**
 * @param {string} s - Plain string.
 */

function takeString(s) {
  if (!inspectType(s, "string", 'takeString', 's')) {
    youCanAddABreakpointHere();
  }
  return s;
}
taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
}); // ok: every slot takes a string

takeString(taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
})); // ok: returns the pinned string

// @ts-expect-error: number is not assignable to string

 // ok: returns the pinned string

// @ts-expect-error: number is not assignable to string
taggedShapes(123, ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', [123], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', ['ok'], {
  v: 123
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 123
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 123]]), new Set(['ok']), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set([123]), {
  k: 'ok'
});
// @ts-expect-error: number is not assignable to string

taggedShapes('ok', ['ok'], {
  v: 'ok'
}, (x) => {
  return x;
}, TakesString, {
  a: 'ok'
}, ['ok'], 'ok', new Map([['a', 'ok']]), new Set(['ok']), {
  k: 123
});
