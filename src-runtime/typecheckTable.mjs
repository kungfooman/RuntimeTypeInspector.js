function createTable() {
  if (typeof document === 'undefined') {
    return null;
  }
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const th_0 = document.createElement('th');
  const th_1 = document.createElement('th');
  const th_2 = document.createElement('th');
  th_0.innerText = 'dbg;';
  th_1.innerText = 'Hits';
  th_2.innerText = 'Message';
  tr.append(th_0, th_1, th_2);
  table.append(tr);
  //table.style.maxHeight = '200px';
  //table.style.overflow = 'scroll';
  //table.style.textWrap = 'nowrap';
  return table;
}
const typecheckWarnedTable = createTable();
export {typecheckWarnedTable};
