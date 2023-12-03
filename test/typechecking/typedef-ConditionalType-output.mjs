registerTypedef('NestArray', {
  "type": "condition",
  "checkType": {
    "type": "indexedAccess",
    "index": "'length'",
    "object": "Acc"
  },
  "extendsType": "Depth",
  "trueType": "T",
  "falseType": {
    "type": "reference",
    "name": "NestArray",
    "args": [
      {
        "type": "array",
        "elementType": "T"
      },
      "Depth",
      {
        "type": "tuple",
        "elements": [
          {
            "type": "rest",
            "annotation": "Acc"
          },
          "never"
        ]
      }
    ]
  }
});
