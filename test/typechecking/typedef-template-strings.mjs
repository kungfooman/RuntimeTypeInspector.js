/**
 * @typedef {"welcome_email" | "email_heading"} EmailLocaleIDs
 * @typedef {"footer_title" | "footer_sendoff"} FooterLocaleIDs
 * @typedef {`${EmailLocaleIDs | FooterLocaleIDs}_id`} AllLocaleIDs
 * @typedef {"en" | "ja" | "pt"} Lang
 * @typedef {`${Lang}_${AllLocaleIDs}`} LocaleMessageIDs
 */
