const typedArrayTypes = [Int8Array, Float32Array];
class VertexIteratorAccessor {
  constructor(buffer, vertexElement, vertexFormat) {
    if (vertexFormat.interleaved) {
      this.array = new typedArrayTypes[vertexElement.dataType](buffer, vertexElement.offset);
    }
  }
}
