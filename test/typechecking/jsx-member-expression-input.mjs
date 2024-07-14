import React from 'react';
import {createRoot} from 'react-dom/client';
const div = document.createElement('div');
document.body.prepend(div);
createRoot(div).render(
  <React.StrictMode>
    <div>Hai!</div>
  </React.StrictMode>
);
