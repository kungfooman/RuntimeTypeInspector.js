function VecAxis(axis = 'x', value = 0) {
  return {
    x: 0,
    y: 0,
    z: 0,
    [axis]: value
  };
}
const vec = VecAxis('y', 10);
console.log('vec', vec);
