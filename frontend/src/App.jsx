import { Routes, Route } from 'react-router-dom';

import Home from "./pages/Homepage";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Perfil from './pages/Perfil';
import Noticias from './pages/ListaNoticias';
import NoticiaDetalle from './pages/NoticiaDetalle';
import SistemaReporte from './pages/SistemaReporte';
import CrearNoticia from './pages/CrearNoticia';
import Chats from './pages/Chats';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/chats" element={<Chats />} />
      {/* <Route
        path="/"
        element={
          <ProtectedRoute fallback={<Navigate to="/login" />}>
            <Home />
          </ProtectedRoute>
        }
      /> */}
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/creadorNoticias" element={<CrearNoticia />} />
      <Route path="/noticias/:id" element={<NoticiaDetalle />} />
      <Route path="/reportes" element={<SistemaReporte />} />
    </Routes>
  );
}

export default App;
