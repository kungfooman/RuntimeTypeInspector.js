registerTypedef('IfEquals', {
  "type": "condition",
  "checkType": {
    "type": "function",
    "parameters": []
  },
  "extendsType": {
    "type": "function",
    "parameters": []
  },
  "trueType": "A",
  "falseType": "B"
}, ["X","Y","A","B"]);
registerTypedef('Shape', {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "readonly": true
    },
    "enabled": "boolean"
  }
});
registerTypedef('WritableKeys', {
  "type": "indexedAccess",
  "index": {
    "type": "keyof",
    "argument": "T"
  },
  "object": {
    "type": "mapping",
    "iterable": {
      "type": "keyof",
      "argument": "T"
    },
    "element": "P",
    "result": {
      "type": "reference",
      "name": "IfEquals",
      "args": [
        {
          "type": "mapping",
          "iterable": "P",
          "element": "Q",
          "result": {
            "type": "indexedAccess",
            "index": "P",
            "object": "T"
          }
        },
        {
          "type": "mapping",
          "iterable": "P",
          "element": "Q",
          "result": {
            "type": "indexedAccess",
            "index": "P",
            "object": "T"
          },
          "readonly": "-"
        },
        "P"
      ]
    },
    "question": "-"
  }
}, ["T"]);

/**
 * Resolves to `A` when the types `X` and `Y` are identical, otherwise to `B`.
 *
 * @template X
 * @template Y
 * @template [A=X]
 * @template [B=never]
 * @typedef {(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B} IfEquals
 */

/**
 * Component shape with one readonly property.
 *
 * @typedef {{ readonly id: string, enabled: boolean }} Shape
 */

/**
 * The writable keys of `T`: readonly properties are dropped.
 *
 * @template T
 * @typedef {{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]} WritableKeys
 */

/**
 * @template {Shape} T
 * @param {WritableKeys<T>} keys
 */
function takeWritable(keys) {
  const rtiTemplates = {
    "T": "Shape"
  };
  if (!inspectTypeWithTemplates(keys, {
    "type": "reference",
    "name": "WritableKeys",
    "args": [
      "T"
    ],
    "optional": false
  }, 'takeWritable', 'keys', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return keys;
}
takeWritable("enabled"); // ok

takeWritable("id"); // warns: readonly dropped

takeWritable("nope"); // warns: unknown key

