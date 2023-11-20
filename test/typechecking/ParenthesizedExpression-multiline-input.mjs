function test(bool = false) {
  return /** @type {number} */ (
    bool ? 1 : 2
  );
}
