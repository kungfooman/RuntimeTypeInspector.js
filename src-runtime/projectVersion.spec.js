import {options, setProjectVersion} from './options.js';
const tests = [
  () => options.projectVersion === null,
  () => {
    const prev = options.projectVersion;
    setProjectVersion('1.2.3');
    const ret = options.projectVersion === '1.2.3';
    options.projectVersion = prev;
    return ret;
  },
];
export {tests};
