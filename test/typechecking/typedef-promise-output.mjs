registerTypedef('QuestionAnsweringReturnType', {
  "type": "promise",
  "elementType": {
    "type": "union",
    "members": [
      "QuestionAnsweringResult",
      {
        "type": "array",
        "elementType": "QuestionAnsweringResult"
      }
    ]
  }
});
