class ShaderProcessor {
  /**
   * @param {import('./graphics-device.js').GraphicsDevice} device - The graphics device.
   * @param {Array<UniformLine>} uniforms - Lines containing uniforms.
   * @returns {object} - The uniform data.
   */
  static processUniforms(device, uniforms) {
    if (!assertType(device, "GraphicsDevice", 'ShaderProcessor#processUniforms', 'device')) {
      youCanAddABreakpointHere();
    }
    if (!assertType(uniforms, {
      "type": "array",
      "elementType": "UniformLine",
      "optional": false
    }, 'ShaderProcessor#processUniforms', 'uniforms')) {
      youCanAddABreakpointHere();
    }
    uniforms.forEach((uniform) => {
      return 111;
    });
    uniformLinesNonSamplers.forEach((uniform) => {
      return 222;
    });
    return {};
  }
}
registerClass(ShaderProcessor);
