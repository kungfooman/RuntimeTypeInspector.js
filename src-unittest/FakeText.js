/**
 * Minimal DOM text node: just carries its text for dumps.
 */
class FakeText {
  constructor(text) {
    this.text = String(text);
  }
}
export {FakeText};
