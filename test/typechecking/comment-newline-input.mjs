function newSet() {
  // a
  /*b*/
  if (true /* c */ ) {
    /** d */
    "@todo remove this for another test - comment is skipped with no statements here";
  }
  // e
  return /* f */ new Set();
}
function newSet2() {
  // a
  /*a*/
  // b
  return /* 1 */ new /* 2 */ Set /* 3 */ ();
}
