import { Routes, Route } from 'react-router-dom';

import Home from "./pages/Homepage";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import Noticias from './pages/ListaNoticias';
import NoticiaDetalle from './pages/NoticiaDetalle';
import SistemaReporte from './pages/SistemaReporte';
import CrearNoticia from './pages/CrearNoticia';
import Administracion from './pages/Adminsitracion';
import Reportes from './pages/Reportes';
import Chats from './pages/Chats';
import CrearAdmin from './pages/CrearAdmin';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/crear-admin" element={<CrearAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil/editar" element={<EditarPerfil />} />
      <Route path="/chats" element={<Chats />} />
      
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/creadorNoticias" element={<CrearNoticia />} />
      <Route path="/noticias/:id" element={<NoticiaDetalle />} />
      <Route path="/reportes" element={<SistemaReporte />} />
      <Route path="/administracion" element={<Administracion />} />
      <Route path="/administracion/reportes" element={<Reportes />} />

    </Routes>
  );
}

export default App;
