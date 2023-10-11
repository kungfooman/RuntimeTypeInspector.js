function* testGen() {
  yield 1;
}
const testGen2 = function* () {
  yield 1;
}
elaborateElementwise(
  function* () {
    yield elem;
  }()
);
