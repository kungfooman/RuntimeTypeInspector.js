/*
const catharsis = require("catharsis");
const originalParse = catharsis.parse;
catharsis.parse = function (str) {
  // console.log("catharsis.parse-ts", str);
  //if (str[0] == '[') {
  //  return originalParse('Array<*>');
  //}
  try {
    return originalParse(...arguments);
  } catch (e) {
    console.log("ERROR PARSING ", str);
    return originalParse('any');
    //return originalParse('any');
  }
};
*/
