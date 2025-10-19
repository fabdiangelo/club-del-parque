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
import TemporadasPage from './pages/Temporadas';
import PartidosGestor from './pages/PartidosGestor';
import NotFound from './pages/NotFound';
import Partido from './pages/Partido';
import { RoleProtectedRoute } from './contexts/AuthProvider';
import SinSesion from './components/SinSesion';
import SoloAdmin from './components/SoloAdmin';

function App() {
  return (
    <Routes>
      {/* Rutas Publicas */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/crear-admin" element={<CrearAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/noticias/:id" element={<NoticiaDetalle />} />
      <Route path="/reportes" element={<SistemaReporte />} />
      <Route path="/campeonatos" element={<ListaCampeonatos />} />
      <Route path="/campeonato/:id" element={<FixtureCampeonato />} />
      <Route path="/partido/:id" element={<Partido />} />

      {/* Rutas Usuarios (cualquier usuario autenticado) */}
      <Route
        path="/perfil"
        element={
          <RoleProtectedRoute fallback={<SinSesion />} unauthorizedFallback={<SinSesion />}>
            <Perfil />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/perfil/editar"
        element={
          <RoleProtectedRoute fallback={<SinSesion />} unauthorizedFallback={<SinSesion />}>
            <EditarPerfil />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <RoleProtectedRoute fallback={<SinSesion />} unauthorizedFallback={<SinSesion />}>
            <Chats />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/chats/:id"
        element={
          <RoleProtectedRoute fallback={<SinSesion />} unauthorizedFallback={<SinSesion />}>
            <Chats />
          </RoleProtectedRoute>
        }
      />

      {/* Rutas Federados (federado o administrador) */}
      <Route
        path="/ranking"
        element={
          <RoleProtectedRoute requiredRoles={["federado", "administrador"]} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <Rankings />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/gestor-partidos"
        element={
          <RoleProtectedRoute requiredRoles={["federado", "administrador"]} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <PartidosGestor />
          </RoleProtectedRoute>
        }
      />
      
      
      {/* Rutas Administradores (solo administrador) */}
      <Route
        path="/crear-noticia"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <CrearNoticia />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/crear-campeonato"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <CrearCampeonato />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/temporadas"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <TemporadasPage />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/administracion"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <Administracion />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/administracion/reportes"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <AdministracionReportes />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/administracion/usuarios"
        element={
          <RoleProtectedRoute requiredRoles={"administrador"} fallback={<SinSesion />} unauthorizedFallback={<SoloAdmin />}>
            <AdministracionUsuarios />
          </RoleProtectedRoute>
        }
      />


      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
