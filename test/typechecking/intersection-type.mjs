/**
 * @typedef {object} Entity
 * @property {string} name - The name.
 * @property {string} favoriteHobby - Favorite hobby
 * @property {string} favoriteAnimal - favorite animal.
 */
/** @type {Entity} */
const santa = {
  name: "Santa Claus",
  favoriteHobby: "delivering presents",
  favoriteAnimal: "reindeer",
};
/** @type {Entity} */
const easterBunny = {
  name: "Easter Bunny",
  favoriteHobby: "hiding eggs",
  favoriteAnimal: "bunny",
};
/** @typedef {Entity & {superpower: string}} Superhero */
/**
 * This function takes two objects, combines them, and returns the result.
 * @param {Entity} entity - Any old entity
 * @returns {Superhero} The super combined entity with a superpower
 */
function turnIntoSuperhero(entity) {
  return {...entity, superpower: "super strength"};
}
const superSanta = turnIntoSuperhero(santa);
const superEasterBunny = turnIntoSuperhero(easterBunny);
/**
 * @param {Superhero} entity - The superhero.
 */
function describeSuperhero(entity) {
  const {name, superpower} = entity;
  console.log(`${name} has the superpower ${superpower}.`);
}
describeSuperhero(superSanta);
describeSuperhero(superEasterBunny);
describeSuperhero(santa);
