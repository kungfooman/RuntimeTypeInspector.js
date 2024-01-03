function createTable() {
  if (typeof document === 'undefined') {
    return null;
  }
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const th_0 = document.createElement('th');
  const th_1 = document.createElement('th');
  const th_2 = document.createElement('th');
  const th_3 = document.createElement('th');
  th_0.innerText = 'Hide';
  th_1.innerText = 'Debug';
  th_2.innerText = 'Hits';
  th_3.innerText = 'Message';
  tr.append(th_0, th_1, th_2, th_3);
  table.append(tr);
  //table.style.maxHeight = '200px';
  //table.style.overflow = 'scroll';
  //table.style.textWrap = 'nowrap';
  return table;
}
const warnedTable = createTable();
export {warnedTable};
