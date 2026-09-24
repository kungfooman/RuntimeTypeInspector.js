const typedArrayTypes = [Int8Array, Float32Array];
class VertexIteratorAccessor {
  constructor(buffer, vertexElement, vertexFormat) {
    if (vertexFormat.interleaved) {
      this.array = new (inspectIndexedAccess(typedArrayTypes, vertexElement.dataType, "VertexIteratorAccessor#constructor"))(buffer, vertexElement.offset);
    }
  }
}
registerClass(VertexIteratorAccessor);
