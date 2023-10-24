// Stringifer should keep the short-form, while Asserter expands it
// into a BlockStatement + ReturnStatement for potential type asseritions.
images.map(x => RawImage.read(x));
