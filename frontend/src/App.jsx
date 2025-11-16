import { Routes, Route } from "react-router-dom";

import Home from "./pages/Homepage";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
import Noticias from "./pages/ListaNoticias";
import NoticiaDetalle from "./pages/NoticiaDetalle";
import SistemaReporte from "./pages/SistemaReporte";
import CrearNoticia from "./pages/CrearNoticia";
import Administracion from "./pages/Adminsitracion";
import AdministracionReportes from "./pages/AdministracionReportes";
import AdministracionUsuarios from "./pages/AdministracionUsuarios";
import Chats from "./pages/Chats";
import Reservas from "./pages/Reservas";
import PerfilReservas from "./pages/PerfilReservas";
import CrearAdmin from "./pages/CrearAdmin";
import CrearCampeonato from "./pages/CrearCampeonato";
import FixtureCampeonato from "./pages/FixtureCampeonato";
import ListaCampeonatos from "./pages/ListaCampeonatos";
import Rankings from "./pages/Ranking";
import TemporadasPage from "./pages/Temporadas";
import PartidosGestor from "./pages/PartidosGestor";
import AcuerdoResultado from "./pages/AcuerdoResultado";
import NotFound from "./pages/NotFound";
import Partido from "./pages/Partido";
import ResultadosPage from "./pages/ResultadosPage";
import NotificationsPage from "./pages/NotificacionesPage";
import CanchasGestor from "./pages/CanchasGestor";
import { RoleProtectedRoute, useAuth } from "./contexts/AuthProvider";
import SinSesion from "./components/SinSesion";
import SoloAdmin from "./components/SoloAdmin";
import CategoriasGestor from "./pages/CategoriasGestor";
import FiltrosGestor from "./pages/FiltrosGestor";
import AsignarCategoriaFederado from "./pages/AsignarCategoriaFederado";
import { messaging } from "./utils/FirebaseService";
import { getToken, onMessage } from "firebase/messaging";
import { useEffect } from "react";

function App() {
  const {user} = useAuth();


  useEffect(() => {
  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: 'BDCSL7Fj7jfxuhR7jPVnLkUiIADoL3kyqsdymO2cMPqEU9JlE2V6ypmOMou3PS6bdPFN9aUNyTHwMrRfXb5O4ls' 
      });

      if (!user) return; 
      const response = await fetch('/api/usuarios/noti-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uid: user.uid,
          token: token,
        }),
      });

      if (!response.ok) return console.error(response.statusText);
    }
  };

  if (user) {
    requestPermission();
  }

  

}, [user]);


  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Registro />} />
      <Route path="/crear-admin" element={<CrearAdmin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/noticias/:id" element={<NoticiaDetalle />} />
      <Route path="/resultados" element={<ResultadosPage />} />
      <Route path="/reportes" element={<SistemaReporte />} />
      <Route path="/campeonatos" element={<ListaCampeonatos />} />
      <Route path="/campeonato/:id" element={<FixtureCampeonato />} />
      <Route path="/partido/:id" element={<Partido />} />

      {/* Rutas Usuarios (cualquier usuario autenticado) */}
      <Route
        path="/perfil"
        element={
          <RoleProtectedRoute
            fallback={<SinSesion />}
            unauthorizedFallback={<SinSesion />}
          >
            <Perfil />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/perfil/editar"
        element={
          <RoleProtectedRoute
            fallback={<SinSesion />}
            unauthorizedFallback={<SinSesion />}
          >
            <EditarPerfil />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <RoleProtectedRoute
            fallback={<SinSesion />}
            unauthorizedFallback={<SinSesion />}
          >
            <Chats />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/chats/:id"
        element={
          <RoleProtectedRoute
            fallback={<SinSesion />}
            unauthorizedFallback={<SinSesion />}
          >
            <Chats />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <RoleProtectedRoute
            fallback={<SinSesion />}
            unauthorizedFallback={<SinSesion />}
          >
            <NotificationsPage />
          </RoleProtectedRoute>
        }
      />
      <Route path="/gestor-categorias" element={<CategoriasGestor />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil/editar" element={<EditarPerfil />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/chats/:id" element={<Chats />} />
      <Route
        path="/asignarcategoriafederado"
        element={<AsignarCategoriaFederado />}
      />

      <Route
        path="/ranking"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <Rankings />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/gestor-partidos"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <PartidosGestor />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/partidos/:id/acuerdo"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <AcuerdoResultado />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/reservas"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <Reservas />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/reservas/:id"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <PerfilReservas />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/partido/:id"
        element={
          <RoleProtectedRoute
            requiredRoles={["federado", "administrador"]}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <Partido />
          </RoleProtectedRoute>
        }
      />

      {/* Rutas Administradores (solo administrador) */}
      <Route
        path="/crear-noticia"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <CrearNoticia />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/crear-campeonato"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <CrearCampeonato />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/temporadas"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <TemporadasPage />
          </RoleProtectedRoute>
        }
      />
      <Route 
        path="/gestor-filtros" 
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <FiltrosGestor />
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/canchas" 
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <CanchasGestor />
          </RoleProtectedRoute>
        } 
      />
      <Route
        path="/administracion"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <Administracion />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/administracion/reportes"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <AdministracionReportes />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/administracion/usuarios"
        element={
          <RoleProtectedRoute
            requiredRoles={"administrador"}
            fallback={<SinSesion />}
            unauthorizedFallback={<SoloAdmin />}
          >
            <AdministracionUsuarios />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
export default App;
