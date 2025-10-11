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
import AdministracionReportes from './pages/AdministracionReportes';
import AdministracionUsuarios from './pages/AdministracionUsuarios';
import Chats from './pages/Chats';
import CrearAdmin from './pages/CrearAdmin';
import CrearCampeonato from './pages/CrearCampeonato';
import FixtureCampeonato from './pages/FixtureCampeonato'
import ListaCampeonatos from './pages/ListaCampeonatos';
import Rankings from './pages/Ranking';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/crear-admin" element={<CrearAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/noticias/:id" element={<NoticiaDetalle />} />
      <Route path="/reportes" element={<SistemaReporte />} />
      <Route path="/campeonatos" element={<ListaCampeonatos />} />
      <Route path="/campeonato/:id" element={<FixtureCampeonato />} />
      <Route path="/ranking" element={<Rankings />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil/editar" element={<EditarPerfil />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/creadorNoticias" element={<CrearNoticia />} />
      <Route path="/crear-campeonato" element={<CrearCampeonato />} />
      <Route path="/administracion" element={<Administracion />} />
      <Route path="/administracion/reportes" element={<AdministracionReportes />} />
      <Route path="/administracion/usuarios" element={<AdministracionUsuarios />} />

    </Routes>
  );
}

export default App;
