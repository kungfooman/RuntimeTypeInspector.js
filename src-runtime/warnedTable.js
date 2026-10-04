import {Table, Tr} from './jsx.js';
import {createTableHead} from './createTableHead.js';
function createTable() {
  if (typeof document === 'undefined') {
    return null;
  }
  const descs = ['Hide', 'Debug', 'Hits', 'Loc', 'Name', 'Expect', 'Value', 'Message', 'Inspect'];
  return Table({},
               Tr({}, ...descs.map(createTableHead))
  );
}
export {createTable};
