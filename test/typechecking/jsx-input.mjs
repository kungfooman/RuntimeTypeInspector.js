// Testing place: https://react.dev/reference/react/createElement
const keys = ['Water', 'Fire', 'Air'];
export default function App() {
  return (
    <ul>
      {keys.map((key) => (
        <li key={key}>Key is {key}</li>
      ))}
    </ul>
  );
}
