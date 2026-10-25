registerTypedef('ConstructorLike', {
  "type": "new",
  "parameters": [
    {
      "type": "array",
      "elementType": {
        "type": "parameter",
        "paramType": {
          "type": "array",
          "elementType": "any"
        },
        "name": "args"
      }
    }
  ],
  "ret": "any"
});

