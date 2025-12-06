import React, { useState, useEffect } from "react";
import ReporteFederacionModal from "../components/administracion-reportes/ReporteFederacionModal";
import ReporteDefaultModal from "../components/administracion-reportes/ReporteDefaultModal";
import SoloAdmin from "../components/SoloAdmin";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import GraficoGauge from "../components/GraficoGauge";
import ReporteDisputaPartidoModal from "../components/administracion-reportes/ReporteDisputaPartidoModal";

import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
import {
  Flame,
  Server,
  Database,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  Newspaper,
  Award,
  Trophy,
  BarChart3,
  Plus,
  Eye,
} from "lucide-react";
import Reservas from "./Reservas";

const Administracion = () => {
  const { user } = useAuth();

  const [metricas, setMetricas] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [cantidadUsuarios, setCantidadUsuarios] = useState(0);
  const [cantidadFederados, setCantidadFederados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalReporte, setModalReporte] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const botones = [
    { nombre: "Administración", ventana: "administracion" },
    { nombre: "Tickets", ventana: "tickets" },
    { nombre: "Reservas", ventana: "reservas" },
  ];
  const [ventana, setVentana] = useState("administracion");
  const [botonActivo, setBotonActivo] = useState("administracion");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtener métricas
      let metricasRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/infraestructura/metricas`, {
        credentials: "include",
      });
      if (metricasRes.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const metricasData = await metricasRes.json();
      setMetricas(metricasData);
      // Obtener todos los reportes
      let reportesRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/sin-resolver`, {
        credentials: "include",
      });
      if (reportesRes.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const reportesData = await reportesRes.json();
      if (reportesData.length > 0) {
        setReportes(reportesData);
      }
      // Obtener cantidad de usuarios
      let usuariosRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/cantidad`, {
        credentials: "include",
      });
      if (usuariosRes.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const cantidades = await usuariosRes.json();
      setCantidadUsuarios(cantidades.usuarios);
      setCantidadFederados(cantidades.federados);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar los datos: " + err.message);
      setLoading(false);
    }
  };

  const marcarComoResuelto = async (idReporte) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/marcar-resuelto/${idReporte}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }

      setReportes((prev) => prev.filter((r) => r.id !== idReporte));
      await fetchData();
      setModalReporte(null);
    } catch (err) {
      console.error("Error al marcar como resuelto:", err);
    }
  };

  const validarFederacion = async (idReporte, planId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/validar-federacion/${idReporte}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      marcarComoResuelto(idReporte);
    } catch (err) {
      console.error("Error al validar federación:", err);
    }
  };

  const marcarComoNoResuelto = async (idReporte) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/marcar-resuelto/${idReporte}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      setReportes(
        reportes.map((reporte) =>
          reporte.id === idReporte
            ? { ...reporte, estado: "pendiente" }
            : reporte
        )
      );
      setModalReporte(null);
    } catch (err) {
      console.error("Error al desmarcar como resuelto:", err);
    }
  };

  const negarFederacion = async (idReporte) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/negar-federacion/${idReporte}`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      marcarComoResuelto(idReporte);
    } catch (err) {
      console.error("Error al negar federación:", err);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "reporte_bug":
        return "bg-red-100 text-red-800";
      case "disputa_resultado":
        return "bg-orange-100 text-orange-800";
      case "sugerencia":
      case "solicitud_federacion":
        return "bg-blue-100 text-blue-800";
      case "soporte":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "reporte_bug":
        return AlertCircle;
      case "disputa_resultado":
        return AlertCircle;
      case "sugerencia":
        return Clock;
      case "soporte":
      case "solicitud_federacion":
        return Users;
      default:
        return AlertCircle;
    }
  };

  if (isUnauthorized) {
    return <SoloAdmin />;
  }
  if (!user || user.rol !== "administrador") {
    console.log(user);
    return <SoloAdmin />;
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 text-center">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 relative overflow-hidden">
      <div
        className="overflow-hidden"
        style={{
          backgroundImage: "url('/FondoAdmin.svg')",
          width: "100vw",
          height: "100vh",
          position: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          bottom: 0,
          left: 0,
          zIndex: -1,
        }}
      ></div>
      <NavbarBlanco />
      <div
        className="max-w-7xl mx-auto relative"
        style={{ marginTop: "3rem", zIndex: 1 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {ventana === "administracion"
              ? "Panel de Administración"
              : ventana === "tickets"
                ? "Tickets y Usuarios"
                : "Reservas"}
          </h1>
          <p className="text-gray-600">
            {ventana === "administracion"
              ? "Monitoreo de consumo y reportes de Firebase"
              : ventana === "tickets"
                ? "Gestión de tickets y usuarios del sistema."
                : "Gestión de reservas de canchas."}
          </p>
        </div>
        <div
          className="mb-8 flex flex-wrap gap-2 md:gap-4"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.5rem',
          }}
        >
          {botones.map((b) => (
            <button
              key={b.nombre}
              className={`flex-1 min-w-[100px] max-w-[160px] py-2 px-4 rounded-full text-sm md:text-base whitespace-nowrap ${
                botonActivo === b.ventana
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => {
                setVentana(b.ventana);
                setBotonActivo(b.ventana);
              }}
              style={{
                maxWidth: '160px',
                flexBasis: '0',
              }}
            >
              {b.nombre}
            </button>
          ))}
        </div>
        {ventana === "administracion" ? (
          <>
            <div>
              <h2 className="text-3xl font-bold">Bienvenido, {user.nombre}!</h2>

              {/* Sección de Atajos Rápidos */}
              <div className="mt-8 mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Atajos Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  {/* Crear Temporada */}
                  <Link
                    to="/temporadas"
                    className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Temporadas</h4>
                        <p className="text-sm opacity-90">Crear/ver temporadas</p>
                      </div>
                    </div>
                  </Link>

                  {/* Crear Noticia */}
                  <Link
                    to="/crear-noticia"
                    className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Nueva Noticia</h4>
                        <p className="text-sm opacity-90">Crear noticia</p>
                      </div>
                    </div>
                  </Link>

                  {/* Ver Noticias */}
                  <Link
                    to="/noticias"
                    className="group bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <Newspaper className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Noticias</h4>
                        <p className="text-sm opacity-90">Ver todas las noticias</p>
                      </div>
                    </div>
                  </Link>

                  {/* Rankings */}
                  <Link
                    to="/ranking"
                    className="group bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Rankings</h4>
                        <p className="text-sm opacity-90">Ver rankings</p>
                      </div>
                    </div>
                  </Link>

                  {/* Resultados */}
                  <Link
                    to="/resultados"
                    className="group bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Resultados</h4>
                        <p className="text-sm opacity-90">Ver resultados</p>
                      </div>
                    </div>
                  </Link>

                  {/* Gestionar Campeonatos */}
                  <Link
                    to="/crear-campeonato"
                    className="group bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">Campeonatos</h4>
                        <p className="text-sm opacity-90">Crear campeonato</p>
                      </div>
                    </div>
                  </Link>

                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 mb-8 text-white">



              <h2 className="text-xl font-semibold mb-2">
                Gasto Total del Mes
              </h2>
              <p className="text-4xl font-bold">
                ${metricas?.gastoTotal.toFixed(2)}
              </p>
              <p className="text-sm opacity-90 mt-2">
                Período:{" "}
                {new Date(metricas?.periodo.inicio).toLocaleDateString()} -{" "}
                {new Date(metricas?.periodo.fin).toLocaleDateString()}
              </p>
            </div>

            {/* Gauges de Uso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <GraficoGauge
                value={metricas?.cloudFunctions.usado}
                max={metricas?.cloudFunctions.limite}
                title="Servidor (invocaciones)"
                icon={Flame}
                color="#F59E0B"
              />

              <GraficoGauge
                value={metricas?.hosting.usado}
                max={metricas?.hosting.limite}
                title="Hosting (GB)"
                icon={Server}
                color="#8B5CF6"
              />

              <GraficoGauge
                value={metricas?.firestore.porcentajePromedio}
                max={100}
                title="Almacenamiento"
                icon={Database}
                color="#3B82F6"
              />
            </div>

            {/* Detalles de Firestore */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600" />
                Detalles de Almacenamiento
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Lecturas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas?.firestore.lecturas.porcentaje}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {metricas?.firestore.lecturas.usado.toLocaleString()} /{" "}
                    {metricas?.firestore.lecturas.limite.toLocaleString()}
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Escrituras</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas?.firestore.escrituras.porcentaje}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {metricas?.firestore.escrituras.usado.toLocaleString()} /{" "}
                    {metricas?.firestore.escrituras.limite.toLocaleString()}
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm text-gray-600">Eliminaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas?.firestore.eliminaciones.porcentaje}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {metricas?.firestore.eliminaciones.usado.toLocaleString()} /{" "}
                    {metricas?.firestore.eliminaciones.limite.toLocaleString()}
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600">Almacenamiento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas?.firestore.almacenamiento.porcentaje}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {metricas?.firestore.almacenamiento.usado} GB /{" "}
                    {metricas?.firestore.almacenamiento.limite} GB
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : ventana === "tickets" ? (
          <>
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-8">
              {/* Tickets/Reportes */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6 mt-8 md:mt-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    TICKETS ({reportes.length})
                  </h2>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="text-gray-300">
                        <th>Datos</th>
                        <th>Mensaje</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportes?.filter(r => r.estado !== "resuelto").map((reporte) => {
                        const TipoIcon = getTipoIcon(reporte.tipo);
                        const reporteProps = {
                          ...reporte,
                          icon: TipoIcon,
                        };
                        return (
                          <tr
                            key={reporte.id}
                            className={`text-white ${reporte.estado == "resuelto" ? "opacity-50" : ""
                              }`}
                          >
                            <td>
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(
                                    reporte.tipo
                                  )} flex items-center gap-1`}
                                >
                                  <TipoIcon className="w-3 h-3" />
                                  {reporte.tipo}
                                </span>
                                {reporte.estado == "resuelto" && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    Resuelto
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar
                                  className="w-4 h-4"
                                  style={{ color: "#4AC0E4" }}
                                />
                                {new Date(reporte.fecha).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="text-white max-w-md">
                              <p className="truncate">{reporte.motivo}</p>
                              <p className="text-xs text-gray-400">
                                {reporte.mailUsuario}
                              </p>
                            </td>
                            <td>
                              {reporte.estado == "resuelto" ? (
                                <button
                                  onClick={() =>
                                    marcarComoNoResuelto(reporte.id)
                                  }
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: "#4AC0E4",
                                    borderColor: "#4AC0E4",
                                    color: "white",
                                  }}
                                >
                                  DESMARCAR
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: "#4AC0E4",
                                      borderColor: "#4AC0E4",
                                      color: "white",
                                    }}
                                    onClick={() => setModalReporte(reporte.id)}
                                  >
                                    VER MÁS
                                  </button>
                                  {modalReporte === reporte.id &&
                                    (reporte.tipo === "solicitud_federacion" ? (
                                      <ReporteFederacionModal
                                        reporte={reporteProps}
                                        onValidar={validarFederacion}
                                        onNegar={negarFederacion}
                                        onClose={() => setModalReporte(null)}
                                      />
                                    ) : reporte.tipo === "disputa_resultado" ? (
                                      <ReporteDisputaPartidoModal
                                        reporte={reporteProps}
                                        onResuelto={async (idRep) => {
                                          await marcarComoResuelto(idRep);
                                        }}
                                        onClose={() => setModalReporte(null)}
                                      />
                                    ) : (
                                      <ReporteDefaultModal
                                        reporte={reporteProps}
                                        onResuelto={marcarComoResuelto}
                                        onClose={() => setModalReporte(null)}
                                      />
                                    ))}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {reportes.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="text-center text-gray-400 py-4"
                          >
                            No hay tickets o reportes sin atender.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {reportes?.filter(r => r.estado !== "resuelto").map((reporte) => {
                    const TipoIcon = getTipoIcon(reporte.tipo);
                    const reporteProps = {
                      ...reporte,
                      icon: TipoIcon,
                    };
                    return (
                      <div
                        key={reporte.id}
                        className="bg-gray-700 rounded-lg p-4 space-y-3"
                      >
                        {/* Tipo y Estado */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(
                              reporte.tipo
                            )} flex items-center gap-1`}
                          >
                            <TipoIcon className="w-3 h-3" />
                            {reporte.tipo}
                          </span>
                          {reporte.estado == "resuelto" && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Resuelto
                            </span>
                          )}
                        </div>

                        {/* Fecha */}
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="w-4 h-4" style={{ color: "#4AC0E4" }} />
                          <span className="text-sm">{new Date(reporte.fecha).toLocaleDateString()}</span>
                        </div>

                        {/* Mensaje */}
                        <div className="text-white">
                          <p className="text-sm mb-1">{reporte.motivo}</p>
                          <p className="text-xs text-gray-400">{reporte.mailUsuario}</p>
                        </div>

                        {/* Acción */}
                        <div className="pt-2">
                          {reporte.estado == "resuelto" ? (
                            <button
                              onClick={() => marcarComoNoResuelto(reporte.id)}
                              className="btn btn-sm w-full"
                              style={{
                                backgroundColor: "#4AC0E4",
                                borderColor: "#4AC0E4",
                                color: "white",
                              }}
                            >
                              DESMARCAR
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm w-full"
                                style={{
                                  backgroundColor: "#4AC0E4",
                                  borderColor: "#4AC0E4",
                                  color: "white",
                                }}
                                onClick={() => setModalReporte(reporte.id)}
                              >
                                VER MÁS
                              </button>
                              {modalReporte === reporte.id &&
                                (reporte.tipo === "solicitud_federacion" ? (
                                  <ReporteFederacionModal
                                    reporte={reporteProps}
                                    onValidar={validarFederacion}
                                    onNegar={negarFederacion}
                                    onClose={() => setModalReporte(null)}
                                  />
                                ) : reporte.tipo === "disputa_resultado" ? (
                                  <ReporteDisputaPartidoModal
                                    reporte={reporteProps}
                                    onResuelto={async (idRep) => {
                                      await marcarComoResuelto(idRep);
                                    }}
                                    onClose={() => setModalReporte(null)}
                                  />
                                ) : (
                                  <ReporteDefaultModal
                                    reporte={reporteProps}
                                    onResuelto={marcarComoResuelto}
                                    onClose={() => setModalReporte(null)}
                                  />
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {reportes.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No hay tickets o reportes sin atender.
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    (window.location.href = "/administracion/reportes")
                  }
                  className="btn btn-lg mt-4 w-full md:w-auto"
                  style={{
                    fontSize: '16px',
                    backgroundColor: "#4AC0E4",
                    borderColor: "#4AC0E4",
                    color: "white",
                  }}
                >
                  VER TODOS LOS TICKETS
                </button>
              </div>


              {/* Usuarios */}
              <div className="border-t border-gray-700 pt-8 mt-8 md:mt-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-2 mt-8 md:mt-0">
                  <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: "#4AC0E4" }} />
                  USUARIOS
                  <span
                    className="text-4xl md:text-5xl font-bold ml-3"
                    style={{ color: "#4AC0E4" }}
                  >
                    {cantidadUsuarios}
                  </span>
                </h2>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-gray-400 text-lg">
                      Usuarios Federados:{" "}
                      <span
                        className="text-xl font-semibold"
                        style={{ color: "#4AC0E4" }}
                      >
                        {cantidadFederados}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      (window.location.href = "/administracion/usuarios")
                    }
                    className="btn btn-lg w-full md:w-auto"
                    style={{
                      backgroundColor: "#4AC0E4",
                      borderColor: "#4AC0E4",
                      color: "white",
                      fontSize: '16px',
                    }}
                  >
                    ADMINISTRAR USUARIOS
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Reservas />
        )}
      </div>
    </div>
  );
};

export default Administracion;
