registerTypedef('ConstructorLike', {
  "type": "new",
  "parameters": [
    {
      "type": "array",
      "elementType": {
        "type": {
          "type": "array",
          "elementType": "any"
        },
        "name": "args"
      }
    }
  ],
  "ret": "any"
});
