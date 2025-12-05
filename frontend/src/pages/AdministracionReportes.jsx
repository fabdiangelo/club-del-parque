import React, { useState, useEffect } from 'react';
import ReporteFederacionModal from '../components/administracion-reportes/ReporteFederacionModal';
import ReporteDefaultModal from '../components/administracion-reportes/ReporteDefaultModal';
import SoloAdmin from '../components/SoloAdmin';
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { useAuth } from '../contexts/AuthProvider';
import { Users, AlertCircle, CheckCircle, Clock, Calendar  } from 'lucide-react';

const AdministracionReportes = () => {
  const { user } = useAuth();

  const [reportes, setReportes] = useState([]);
  const [reportesNoLeidos, setReportesNoLeidos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalReporte, setModalReporte] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let reportesRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`, { credentials: 'include' });
      if (reportesRes.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const reportesData = await reportesRes.json();
      if(reportesData.length > 0){
        setReportes(reportesData);
        setReportesNoLeidos(reportesData.filter(r => r.estado !== 'resuelto').length);
      }
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const marcarComoResuelto = async (idReporte) => {
    try {
      const res = await fetch(`/api/reportes/marcar-resuelto/${idReporte}`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      setReportes(reportes.map(reporte => 
        reporte.id === idReporte ? { ...reporte, estado: 'resuelto' } : reporte
      ));
      setReportesNoLeidos(reportesNoLeidos > 0 ? reportesNoLeidos - 1 : 0);
      setModalReporte(null);
    } catch (err) {
      console.error('Error al marcar como resuleto:', err);
    }
  };

  const validarFederacion = async (idReporte, planId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/validar-federacion/${idReporte}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      marcarComoResuelto(idReporte);
    } catch (err) {
      console.error('Error al validar federación:', err);
    }
  };

  const marcarComoNoResuelto = async (idReporte) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/marcar-resuelto/${idReporte}`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        setModalReporte(null);
        return;
      }
      setReportes(reportes.map(reporte => 
        reporte.id === idReporte ? { ...reporte, estado: 'pendiente' } : reporte
      ));
      setReportesNoLeidos(reportesNoLeidos + 1);
      setModalReporte(null);
    } catch (err) {
      console.error('Error al desmarcar como resuelto:', err);
    }
  };

  const negarFederacion = async (idReporte) => {
    try {
      // const res = await fetch(`/api/notificaciones/negar-federacion/${idReporte}`, {
      //   method: 'PUT',
      //   credentials: 'include'
      // });
      // if (res.status === 401) {
      //   setIsUnauthorized(true);
      //   setModalReporte(null);
      //   return;
      // }
      marcarComoResuelto(idReporte);
    } catch (err) {
      console.error('Error al negar federación:', err);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'reporte_bug': return 'bg-red-100 text-red-800';
      case 'sugerencia': case 'solicitud_federacion': return 'bg-blue-100 text-blue-800';
      case 'soporte': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'reporte_bug': return AlertCircle;
      case 'sugerencia': return Clock;
      case 'soporte': case 'solicitud_federacion': return Users;
      default: return AlertCircle;
    }
  };

  if (isUnauthorized) {
    return <SoloAdmin />;
  }
  if (!user || user.rol !== 'administrador') {
    console.log(user)
    return ( <SoloAdmin /> );
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
    <div className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      <div className="overflow-hidden"
        style={{
          backgroundImage: "url('/FondoAdmin.svg')",
          width: '100vw',
          height: (25 + reportes.length * 5) + 'rem',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          position: 'absolute',
          bottom: 0,
          left: 0,
        }}
      ></div>
      <NavbarBlanco />
      <div className="max-w-7xl mx-auto relative" style={{ marginTop: '3rem', zIndex: 1 }}>
        {/* Header */}
        <div className="mb-8" style={{ marginTop: '4rem', zIndex: 1 }}>
          <div className="flex items-center justify-between mb-6 mt-10">
            <h1 className="text-3xl font-bold text-white">TICKETS ({reportes.length})</h1>
            {reportesNoLeidos > 0 && (
              <span className="badge badge-error badge-lg">{reportesNoLeidos} sin leer</span>
            )}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Tickets/Reportes */}
          <div className="mb-8">
            <div className="overflow-x-auto flex flex-col justify-center">
              <table className="table w-full">
                <thead>
                  <tr className="text-gray-300">
                    <th>Datos</th>
                    <th>Mensaje</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes?.map((reporte) => {
                    const TipoIcon = getTipoIcon(reporte.tipo);
                    const reporteProps = {
                      ...reporte,
                      icon: TipoIcon
                    };
                    return (
                      <tr key={reporte.id} className={`text-white ${reporte.estado == 'resuelto' ? 'opacity-50' : ''}`}>
                        <td>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoColor(reporte.tipo)} flex items-center gap-1`}>
                              <TipoIcon className="w-3 h-3" />
                              {reporte.tipo}
                            </span>
                            {reporte.estado == 'resuelto' && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Resuelto
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" style={{ color: '#4AC0E4' }} />
                            {new Date(reporte.fecha).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-white max-w-md">
                          <p className="truncate">{reporte.motivo}</p>
                          <p className="text-xs text-gray-400">{reporte.mailUsuario}</p>
                        </td>
                        <td>
                          {reporte.estado == 'resuelto' ? (
                            <button
                              onClick={() => marcarComoNoResuelto(reporte.id)}
                              className="btn btn-sm"
                              style={{ backgroundColor: '#4AC0E4', borderColor: '#4AC0E4', color: 'white' }}
                            >
                              DESMARCAR
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm"
                                style={{ backgroundColor: '#4AC0E4', borderColor: '#4AC0E4', color: 'white' }}
                                onClick={() => setModalReporte(reporte.id)}
                              >
                                VER MÁS
                              </button>
                              {modalReporte === reporte.id && (
                                reporte.tipo === 'solicitud_federacion' ? (
                                  <ReporteFederacionModal
                                    reporte={reporteProps}
                                    onValidar={validarFederacion}
                                    onNegar={negarFederacion}
                                    onClose={() => setModalReporte(null)}
                                  />
                                ) : (
                                  <ReporteDefaultModal
                                    reporte={reporteProps}
                                    onResuelto={marcarComoResuelto}
                                    onClose={() => setModalReporte(null)}
                                  />
                                )
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {reportes.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-400 py-4">
                        No se han encontrado reportes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button
                onClick={() => window.location.href = '/administracion'}
                className="btn btn-lg mt-4"
                style={{ backgroundColor: '#4AC0E4', borderColor: '#4AC0E4', color: 'white' }}
              >
                VOLVER AL PANEL ADMINISTRACIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministracionReportes;