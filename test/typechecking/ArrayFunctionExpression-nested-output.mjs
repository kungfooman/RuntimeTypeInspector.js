class XrManager {
  /**
   * @param {XRSession} session - XR session.
   * @param {string} spaceType - Space type to request for the session.
   * @param {Function} callback - Callback to call when session is started.
   * @private
   */
  _onSessionStart(session, spaceType, callback) {
    if (!inspectType(session, "XRSession", 'XrManager#_onSessionStart', 'session')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(spaceType, "string", 'XrManager#_onSessionStart', 'spaceType')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(callback, "Function", 'XrManager#_onSessionStart', 'callback')) {
      youCanAddABreakpointHere();
    }
    let failed = false;
    this._session = session;
    const onVisibilityChange = () => {
      this.fire('visibility:change', session.visibilityState);
    };
    const onClipPlanesChange = () => {
      this._setClipPlanes(this._camera.nearClip, this._camera.farClip);
    };
  }
}
registerClass(XrManager);
