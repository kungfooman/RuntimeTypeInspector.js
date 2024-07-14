import {createElement} from 'react';
// Testing place: https://react.dev/reference/react/createElement
const keys = ['Water', 'Fire', 'Air'];
export default function App() {
  return (
    createElement(
      "ul",
      null,
      keys.map((key) => (
        createElement(
          "li",
          {
            key,
          },
          "Key is ",
          key,
        )
      )),
    )
  );
};
