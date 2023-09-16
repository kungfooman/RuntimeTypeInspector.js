let breakpointID = 0;
/**
 * Function for the sole purpose of being able to add a breakpoint in devtools.
 * It must do "something" or Babel strips it, so we are counting up `breakpointID`.
 *
 * @returns {number} The breakpointID.
 */
function youCanAddABreakpointHere() {
    return breakpointID++;
}
export { breakpointID,  youCanAddABreakpointHere };
