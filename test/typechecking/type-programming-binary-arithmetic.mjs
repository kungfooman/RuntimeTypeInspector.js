/** @typedef {0|1} Bit */
/**
 * @template {Bit} A
 * @template {Bit} B
 * @typedef {A extends 1 ? B extends 1 ? 1 : 0 : 0} And
 */
/**
 * @typedef {And<0, 0>} TestAnd_0_0
 * @typedef {And<0, 1>} TestAnd_0_1
 * @typedef {And<1, 0>} TestAnd_1_0
 * @typedef {And<1, 1>} TestAnd_1_1
 */
/**
 * @template {Bit} A
 * @template {Bit} B
 * @typedef {[A, B] extends [1, 1] ? 1 : 0} AndFancy
 */
/**
 * @typedef {AndFancy<0, 0>} TestAndFancy_0_0
 * @typedef {AndFancy<0, 1>} TestAndFancy_0_1
 * @typedef {AndFancy<1, 0>} TestAndFancy_1_0
 * @typedef {AndFancy<1, 1>} TestAndFancy_1_1
 */
/**
 * @template {Bit} A
 * @template {Bit} B
 * @typedef {A extends 0 ? B extends 0 ? 0 : 1 : 1} Or
 */
/** @typedef {Or<0, 0>} TestOr_0_0 */
/** @typedef {Or<0, 1>} TestOr_0_1 */
/** @typedef {Or<1, 0>} TestOr_1_0 */
/** @typedef {Or<1, 1>} TestOr_1_1 */
/** @typedef {[Bit               ]} UnsignedInt1 */
/** @typedef {[Bit, Bit          ]} UnsignedInt2 */
/** @typedef {[Bit, Bit, Bit     ]} UnsignedInt3 */
/** @typedef {[Bit, Bit, Bit, Bit]} UnsignedInt4 */
/**
 * @template {UnsignedInt1} T
 * @typedef {T extends [0] ? 0 :
 * T extends [1] ? 1 : never
 * } UnsignedInt1ToNumber
 */
/**
 * @typedef {UnsignedInt1ToNumber<[0]>} UnsignedInt1ShouldBeZero
 * @typedef {UnsignedInt1ToNumber<[1]>} UnsignedInt1ShouldBeOne
 */
/**
 * @template {UnsignedInt2} T
 * @typedef {T extends [0, 0] ? 0 :
 * T extends [0, 1] ? 1 :
 * T extends [1, 0] ? 2 :
 * T extends [1, 1] ? 3 : never
 * } UnsignedInt2ToNumber
 */
/**
 * @typedef {UnsignedInt2ToNumber<[0, 0]>} UnsignedInt2ShouldBeZero
 * @typedef {UnsignedInt2ToNumber<[0, 1]>} UnsignedInt2ShouldBeOne
 * @typedef {UnsignedInt2ToNumber<[1, 0]>} UnsignedInt2ShouldBeTwo
 * @typedef {UnsignedInt2ToNumber<[1, 1]>} UnsignedInt2ShouldBeThree
 */
/**
 * @template {UnsignedInt3} T
 * @typedef {T extends [0, 0, 0] ? 0 :
 * T extends [0, 0, 1] ? 1 :
 * T extends [0, 1, 0] ? 2 :
 * T extends [0, 1, 1] ? 3 :
 * T extends [1, 0, 0] ? 4 :
 * T extends [1, 0, 1] ? 5 :
 * T extends [1, 1, 0] ? 6 :
 * T extends [1, 1, 1] ? 7 : never
 * } UnsignedInt3ToNumber
 */
/**
 * @typedef {UnsignedInt3ToNumber<[0, 0, 0]>} UnsignedInt3ShouldBeZero
 * @typedef {UnsignedInt3ToNumber<[0, 0, 1]>} UnsignedInt3ShouldBeOne
 * @typedef {UnsignedInt3ToNumber<[0, 1, 0]>} UnsignedInt3ShouldBeTwo
 * @typedef {UnsignedInt3ToNumber<[0, 1, 1]>} UnsignedInt3ShouldBeThree
 * @typedef {UnsignedInt3ToNumber<[1, 0, 0]>} UnsignedInt3ShouldBeFour
 * @typedef {UnsignedInt3ToNumber<[1, 0, 1]>} UnsignedInt3ShouldBeFive
 * @typedef {UnsignedInt3ToNumber<[1, 1, 0]>} UnsignedInt3ShouldBeSix
 * @typedef {UnsignedInt3ToNumber<[1, 1, 1]>} UnsignedInt3ShouldBeSeven
 */
/**
 * @template {UnsignedInt4} T
 * @typedef {T extends [0, 0, 0, 0] ? 0 :
 * T extends [0, 0, 0, 1] ?  1 :
 * T extends [0, 0, 1, 0] ?  2 :
 * T extends [0, 0, 1, 1] ?  3 :
 * T extends [0, 1, 0, 0] ?  4 :
 * T extends [0, 1, 0, 1] ?  5 :
 * T extends [0, 1, 1, 0] ?  6 :
 * T extends [0, 1, 1, 1] ?  7 :
 * T extends [1, 0, 0, 0] ?  8 :
 * T extends [1, 0, 0, 1] ?  9 :
 * T extends [1, 0, 1, 0] ? 10 :
 * T extends [1, 0, 1, 1] ? 11 :
 * T extends [1, 1, 0, 0] ? 12 :
 * T extends [1, 1, 0, 1] ? 13 :
 * T extends [1, 1, 1, 0] ? 14 :
 * T extends [1, 1, 1, 1] ? 15 : never
 * } UnsignedInt4ToNumber
 */
/**
 * @typedef {UnsignedInt4ToNumber<[0, 0, 0, 0]>} UnsignedInt4ShouldBeZero
 * @typedef {UnsignedInt4ToNumber<[0, 0, 0, 1]>} UnsignedInt4ShouldBeOne
 * @typedef {UnsignedInt4ToNumber<[0, 0, 1, 0]>} UnsignedInt4ShouldBeTwo
 * @typedef {UnsignedInt4ToNumber<[0, 0, 1, 1]>} UnsignedInt4ShouldBeThree
 * @typedef {UnsignedInt4ToNumber<[0, 1, 0, 0]>} UnsignedInt4ShouldBeFour
 * @typedef {UnsignedInt4ToNumber<[0, 1, 0, 1]>} UnsignedInt4ShouldBeFive
 * @typedef {UnsignedInt4ToNumber<[0, 1, 1, 0]>} UnsignedInt4ShouldBeSix
 * @typedef {UnsignedInt4ToNumber<[0, 1, 1, 1]>} UnsignedInt4ShouldBeSeven
 * @typedef {UnsignedInt4ToNumber<[1, 0, 0, 0]>} UnsignedInt4ShouldBeEight
 * @typedef {UnsignedInt4ToNumber<[1, 0, 0, 1]>} UnsignedInt4ShouldBeNine
 * @typedef {UnsignedInt4ToNumber<[1, 0, 1, 0]>} UnsignedInt4ShouldBeTen
 * @typedef {UnsignedInt4ToNumber<[1, 0, 1, 1]>} UnsignedInt4ShouldBeEleven
 * @typedef {UnsignedInt4ToNumber<[1, 1, 0, 0]>} UnsignedInt4ShouldBeTwelve
 * @typedef {UnsignedInt4ToNumber<[1, 1, 0, 1]>} UnsignedInt4ShouldBeThirteen
 * @typedef {UnsignedInt4ToNumber<[1, 1, 1, 0]>} UnsignedInt4ShouldBeFourteen
 * @typedef {UnsignedInt4ToNumber<[1, 1, 1, 1]>} UnsignedInt4ShouldBeFifteen
 */
