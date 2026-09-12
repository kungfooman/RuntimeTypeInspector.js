registerTypedef('EmailLocaleIDs', {
  "type": "union",
  "members": [
    "\"welcome_email\"",
    "\"email_heading\""
  ]
});
registerTypedef('FooterLocaleIDs', {
  "type": "union",
  "members": [
    "\"footer_title\"",
    "\"footer_sendoff\""
  ]
});
registerTypedef('AllLocaleIDs', {
  "type": "templateLiteral",
  "quasis": [
    "",
    "_id"
  ],
  "types": [
    {
      "type": "union",
      "members": [
        "EmailLocaleIDs",
        "FooterLocaleIDs"
      ]
    }
  ]
});
registerTypedef('Lang', {
  "type": "union",
  "members": [
    "\"en\"",
    "\"ja\"",
    "\"pt\""
  ]
});
registerTypedef('LocaleMessageIDs', {
  "type": "templateLiteral",
  "quasis": [
    "",
    "_",
    ""
  ],
  "types": [
    "Lang",
    "AllLocaleIDs"
  ]
});
