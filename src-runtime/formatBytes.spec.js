import {formatBytes} from './formatBytes.js';
function testBytesStayExact() {
  // Below one kibibyte every byte shows: small logs read exact.
  return formatBytes(0) === '0 B' && formatBytes(999) === '999 B';
}
function testKibibytesOneDecimal() {
  // Kibibytes carry one decimal so close sizes stay distinguishable.
  return formatBytes(1024) === '1.0 KB' && formatBytes(384 * 1024) === '384.0 KB';
}
function testMebibytesOneDecimal() {
  // Past one mebibyte the unit flips instead of growing digits.
  return formatBytes(4.2 * 1024 * 1024) === '4.2 MB';
}
function testHostileReadsZero() {
  // A hostile count degrades into `0 B`, never into a broken preview.
  const bad = formatBytes(undefined);
  const negative = formatBytes(-5);
  return bad === '0 B' && negative === '0 B';
}
export const tests = [
  testBytesStayExact,
  testKibibytesOneDecimal,
  testMebibytesOneDecimal,
  testHostileReadsZero,
];
