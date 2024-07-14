import {createElement} from 'react';
import React from 'react';
import {createRoot} from 'react-dom/client';
const div = document.createElement('div');
document.body.prepend(div);
createRoot(div).render(createElement(
  React.StrictMode,
  null,
  createElement(
    "div",
    null,
    "Hai!",
  ),
));
