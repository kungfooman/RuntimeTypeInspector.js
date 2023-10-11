// Without CatchClause param:
try {
  1n / 0;
} catch {
  console.log("Can't do that");
}
// With CatchClause param:
try {
  1n / 0;
} catch (e) {
  console.log("Can't do that", e);
}
