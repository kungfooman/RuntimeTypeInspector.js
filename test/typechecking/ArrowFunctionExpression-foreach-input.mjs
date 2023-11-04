class ShaderProcessor {
  /**
   * @param {import('./graphics-device.js').GraphicsDevice} device - The graphics device.
   * @param {Array<UniformLine>} uniforms - Lines containing uniforms.
   * @returns {object} - The uniform data.
   */
  static processUniforms(device, uniforms, processingOptions, shader) {
    uniforms.forEach((uniform) => {
      return 111;
    });
    uniformLinesNonSamplers.forEach((uniform) => {
      return 222;
    });
    return {};
  }
}
