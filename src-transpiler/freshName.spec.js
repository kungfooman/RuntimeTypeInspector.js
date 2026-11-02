import {freshName} from './freshName.js';

// A base name already present in the source gains one suffix per collision.
function testRepeatedCollisions() {
  return freshName('{"name":"rtiArgs"} {"name":"rtiArgs_"}', 'rtiArgs') === 'rtiArgs__';
}

// An absent base name passes through unchanged.
function testNoCollision() {
  return freshName('{"name":"other"}', 'rtiArgs') === 'rtiArgs';
}

export const tests = [testRepeatedCollisions, testNoCollision];
