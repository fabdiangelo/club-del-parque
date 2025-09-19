import { Routes, Route } from 'react-router-dom';

import Registro from "./pages/Registro";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Registro />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
