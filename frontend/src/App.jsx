import { Routes, Route } from 'react-router-dom';

import Home from "./pages/Homepage";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import SistemaReporte from './pages/SistemaReporte';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/report" element={<SistemaReporte />} />
    </Routes>
  );
}

export default App;
