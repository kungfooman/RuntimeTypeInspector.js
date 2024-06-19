/**
 * Converts bounding boxes from center format to corners format.
 *
 * @param {number[]} arr - The coordinate for the center of the box and its width, height dimensions (center_x, center_y, width, height)
 * @returns {number[]} The coodinates for the top-left and bottom-right corners of the box (top_left_x, top_left_y, bottom_right_x, bottom_right_y)
 */
function center_to_corners_format([centerX, centerY, width, height]) {
  if (!inspectType(arguments[0], {
    "type": "array",
    "elementType": "number",
    "optional": false
  }, 'center_to_corners_format', 'arr')) {
    youCanAddABreakpointHere();
  }
  return [
    centerX - validateDivision(width, 2, "center_to_corners_format"),
    centerY - validateDivision(height, 2, "center_to_corners_format"),
    centerX + validateDivision(width, 2, "center_to_corners_format"),
    centerY + validateDivision(height, 2, "center_to_corners_format")
  ];
}
const corners = center_to_corners_format([13, 14, 100, 200]);
console.log('corners', corners);
