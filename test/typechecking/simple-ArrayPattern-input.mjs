/**
 * Converts bounding boxes from center format to corners format.
 *
 * @param {number[]} arr - The coordinate for the center of the box and its width, height dimensions (center_x, center_y, width, height)
 * @returns {number[]} The coodinates for the top-left and bottom-right corners of the box (top_left_x, top_left_y, bottom_right_x, bottom_right_y)
 */
function center_to_corners_format([centerX, centerY, width, height]) {
  return [
    centerX - width / 2,
    centerY - height / 2,
    centerX + width / 2,
    centerY + height / 2
  ];
}
const corners = center_to_corners_format([13, 14, 100, 200]);
console.log('corners', corners);
