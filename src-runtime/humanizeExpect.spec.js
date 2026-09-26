import {formatCompare, humanizeExpect} from './humanizeExpect.js';
const tests = [
  () => humanizeExpect('K').summary === 'K' &&
    humanizeExpect('K').notes.join(' ').includes('unresolved generic'),
  () => humanizeExpect('number').summary === 'number' && humanizeExpect('number').notes.length === 0,
  () => {
    const {summary} = humanizeExpect({type: 'object', properties: {a: 'number'}, optional: false});
    return summary.includes('a: number');
  },
  () => {
    const {expectPretty, actualPretty} = formatCompare('number', 1);
    return expectPretty === 'number' && actualPretty === '1';
  },
  () => {
    const {actualPretty} = formatCompare('number', {a: 1});
    return actualPretty.includes('"a"');
  },
];
export {tests};
