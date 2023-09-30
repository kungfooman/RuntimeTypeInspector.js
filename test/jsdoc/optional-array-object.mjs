class VertexFormat {
  /**
   * Create a new VertexFormat instance.
   *
   * @param {import('./graphics-device.js').GraphicsDevice} graphicsDevice - The graphics device
   * used to manage this vertex format.
   * @param {object[]} description - An array of vertex attribute descriptions.
   * @param {string} description[].semantic - The meaning of the vertex element. This is used to
   * link the vertex data to a shader input. Can be:
   *
   * - {@link SEMANTIC_POSITION}
   * - {@link SEMANTIC_NORMAL}
   * - {@link SEMANTIC_TANGENT}
   * - {@link SEMANTIC_BLENDWEIGHT}
   * - {@link SEMANTIC_BLENDINDICES}
   * - {@link SEMANTIC_COLOR}
   * - {@link SEMANTIC_TEXCOORD0}
   * - {@link SEMANTIC_TEXCOORD1}
   * - {@link SEMANTIC_TEXCOORD2}
   * - {@link SEMANTIC_TEXCOORD3}
   * - {@link SEMANTIC_TEXCOORD4}
   * - {@link SEMANTIC_TEXCOORD5}
   * - {@link SEMANTIC_TEXCOORD6}
   * - {@link SEMANTIC_TEXCOORD7}
   *
   * If vertex data has a meaning other that one of those listed above, use the user-defined
   * semantics: {@link SEMANTIC_ATTR0} to {@link SEMANTIC_ATTR15}.
   * @param {number} description[].components - The number of components of the vertex attribute.
   * Can be 1, 2, 3 or 4.
   * @param {number} description[].type - The data type of the attribute. Can be:
   *
   * - {@link TYPE_INT8}
   * - {@link TYPE_UINT8}
   * - {@link TYPE_INT16}
   * - {@link TYPE_UINT16}
   * - {@link TYPE_INT32}
   * - {@link TYPE_UINT32}
   * - {@link TYPE_FLOAT32}
   *
   * @param {boolean} [description[].normalize] - If true, vertex attribute data will be mapped
   * from a 0 to 255 range down to 0 to 1 when fed to a shader. If false, vertex attribute data
   * is left unchanged. If this property is unspecified, false is assumed.
   * @param {number} [vertexCount] - When specified, vertex format will be set up for
   * non-interleaved format with a specified number of vertices. (example: PPPPNNNNCCCC), where
   * arrays of individual attributes will be stored one right after the other (subject to
   * alignment requirements). Note that in this case, the format depends on the number of
   * vertices, and needs to change when the number of vertices changes. When not specified,
   * vertex format will be interleaved. (example: PNCPNCPNCPNC).
   * @example
   * // Specify 3-component positions (x, y, z)
   * const vertexFormat = new pc.VertexFormat(graphicsDevice, [
   *     { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 }
   * ]);
   * @example
   * // Specify 2-component positions (x, y), a texture coordinate (u, v) and a vertex color (r, g, b, a)
   * const vertexFormat = new pc.VertexFormat(graphicsDevice, [
   *     { semantic: pc.SEMANTIC_POSITION, components: 2, type: pc.TYPE_FLOAT32 },
   *     { semantic: pc.SEMANTIC_TEXCOORD0, components: 2, type: pc.TYPE_FLOAT32 },
   *     { semantic: pc.SEMANTIC_COLOR, components: 4, type: pc.TYPE_UINT8, normalize: true }
   * ]);
   */
  constructor(graphicsDevice, description, vertexCount) {
  }
}
