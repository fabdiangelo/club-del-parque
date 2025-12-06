import React, { useState, useEffect } from 'react';
import SoloAdmin from '../components/SoloAdmin';
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { useAuth } from '../contexts/AuthProvider';
import { Users, User, AlertCircle, KeyRound, Clock, Pencil, Trash2, Award, CalendarFold, OctagonAlertIcon, RefreshCw } from 'lucide-react';
import ConfirmActionModal from '../components/administracion-usuarios/ConfirmActionModal';
import EditUserModal from '../components/administracion-usuarios/EditUserModal';
import FederarUsuarioModal from '../components/administracion-usuarios/FederarUsuarioModal';

const AdministracionUsuarios = () => {
    // Estado para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 20;
  const { user, loading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalEdicion, setModalEdicion] = useState(null);
  const [modalBloqueo, setModalBloqueo] = useState(null);
  const [modalDesbloqueo, setModalDesbloqueo] = useState(null);
  const [modalEliminacion, setModalEliminacion] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [federadoFilter, setFederadoFilter] = useState('all');
  const [federarModalOpen, setFederarModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.rol !== 'administrador') return;
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const usuariosRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`, { credentials: 'include' });
      if (usuariosRes.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      const baseUsuarios = await usuariosRes.json();

      const federadosRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/federados`, { credentials: 'include' });
      let listaFederados = [];
      if (federadosRes.ok) {
        listaFederados = await federadosRes.json();
      }

      // normalizar posibles nombres de campo y tipado
      const normalizeFederado = (f) => ({
        ...f,
        validoHasta: f?.validoHasta ?? f?.valido_hasta ?? f?.vencimiento ?? null,
        categoriaId: f?.categoriaId ?? f?.categoria_id ?? null,
      });

      // indexar federados por id para lookup rápido
      const federadosById = new Map();
      for (const rf of Array.isArray(listaFederados) ? listaFederados : []) {
        if (!rf?.id) continue;
        const f = normalizeFederado(rf);
        federadosById.set(f.id, f);
      }

      // construir mapa base
      const map = new Map();
      for (const u of Array.isArray(baseUsuarios) ? baseUsuarios : []) {
        if (!u?.id) continue;
        map.set(u.id, { ...u, esFederado: false });
      }

      // mezclar datos de federados y marcar flag
      for (const [fid, f] of federadosById) {
        const prev = map.get(fid);
        if (prev) {
          map.set(fid, {
            ...prev,           // datos base
            ...f,              // completa con campos de federado
            esFederado: true,
            validoHasta: f.validoHasta ?? prev.validoHasta ?? null,
            categoriaId: f.categoriaId ?? prev.categoriaId ?? null,
          });
        } else {
          map.set(fid, {
            ...f,
            esFederado: true,
            validoHasta: f.validoHasta ?? null,
            categoriaId: f.categoriaId ?? null,
          });
        }
      }

      // derivar rol final (admin > federado > usuario)
      const merged = Array.from(map.values()).map((u) => {
        const rolBase = u.rol || 'usuario';
        const rol =
          rolBase === 'administrador'
            ? 'administrador'
            : (u.esFederado ? 'federado' : 'usuario');
        return { ...u, _rolOriginal: rolBase, rol };
      });

      // ordenar por nombre
      merged.sort((a, b) =>
        `${a?.nombre || ''} ${a?.apellido || ''}`.localeCompare(
          `${b?.nombre || ''} ${b?.apellido || ''}`,
          'es'
        )
      );

      setUsuarios(merged);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const bloquearUsuario = async (id) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${id}/bloqueo`, { method: 'PUT', credentials: 'include' });
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (!res.ok) throw new Error('Error bloqueando usuario');
      setUsuarios((u) => u.map(x => x.id === id ? { ...x, estado: 'inactivo' } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setModalBloqueo(null);
    }
  };

  const desbloquearUsuario = async (id) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${id}/bloqueo`, { method: 'PUT', credentials: 'include' });
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (!res.ok) throw new Error('Error desbloqueando usuario');
      setUsuarios((u) => u.map(x => x.id === id ? { ...x, estado: 'activo' } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setModalDesbloqueo(null);
    }
  };

  const eliminarUsuario = async (id) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${id}/eliminacion`, { method: 'PUT', credentials: 'include' });
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (!res.ok) throw new Error('Error eliminando usuario');
      setUsuarios((u) => u.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setModalEliminacion(null);
    }
  };

  const saveEditedUser = async (id, payload) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (!res.ok) throw new Error('Error actualizando usuario');
      const updated = await res.json();
      setUsuarios((u) => u.map(x => x.id === id ? { ...x, ...updated } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setModalEdicion(null);
      setEditingUser(null);
    }
  };

  const getRolColor = (tipo) => {
    switch (tipo) {
      case 'administrador': return 'bg-red-100 text-red-800';
      case 'federado': return 'bg-blue-100 text-blue-800';
      case 'usuario': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRolIcon = (tipo) => {
    switch (tipo) {
      case 'administrador': return KeyRound;
      case 'federado': return Award;
      case 'usuario': return Users;
      default: return AlertCircle;
    }
  };

  const federarUsuario = async (id, planId) => {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/usuarios/validar-federacion/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (!res.ok) throw new Error('Error federando usuario');
      const updated = await res.json();
      setUsuarios((u) => u.map(x => x.id === id ? { ...x, ...updated } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmLoading(false);
      setFederarModalOpen(false);
      setEditingUser(null);
    }
  };

  const matchesFilters = (usuario) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const name = `${usuario.nombre || ''} ${usuario.apellido || ''}`.toLowerCase();
      const email = (usuario.email || usuario.mail || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    if (roleFilter) {
      if (usuario.rol !== roleFilter) return false;
    }
    if (federadoFilter !== 'all') {
      const vencimiento = usuario.rol === "federado" && usuario.validoHasta ? new Date(usuario.validoHasta) : null;
      const now = new Date();
      const isExpired = vencimiento ? vencimiento < now : true; // si no hay fecha, se trata como vencido
      if (usuario.rol !== "federado") return false;
      if (federadoFilter === 'active' && !vencimiento) return false;
      if (federadoFilter === 'active' && isExpired) return false;
      if (federadoFilter === 'expired' && !isExpired) return false;
    }
    return true;
  };

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = nacimiento.getMonth();
    const diaNacimiento = nacimiento.getDate();
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }
    return edad;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return <SoloAdmin />;
  }

  if (!user || user.rol !== 'administrador') {
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

  return (<>
    <div className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      <div className="overflow-hidden"
        style={{
          backgroundImage: "url('/FondoAdmin.svg')",
          width: '100vw',
          height: (25 + usuarios.length * 5) + 'rem',
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
          <div className="flex items-center justify-between mb-6 mt-10" style={{display: 'inline'}}>
            <h1 className="text-3xl font-bold" >
              USUARIOS ({usuarios.length})
              <RefreshCw className="ml-4" style={{ color: '#4AC0E4', display:'inline' }} onClick={fetchData} disabled={loading}/>
            </h1>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Usuarios */}
          <div className="mb-8">
            <div className="flex flex-col gap-3 mb-4 items-stretch sm:flex-row sm:items-center">
              <input
                placeholder="Buscar por nombre o email"
                className="input input-bordered w-full sm:w-48"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
              />
              <select
                className="select select-bordered"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Todos los roles</option>
                <option value="usuario">usuario</option>
                <option value="federado">federado</option>
                <option value="administrador">administrador</option>
              </select>
              <select
                className="select select-bordered"
                value={federadoFilter}
                onChange={(e) => { setFederadoFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Todos</option>
                <option value="active">Federados activos</option>
                <option value="expired">Federados vencidos</option>
              </select>
              <div className="ml-auto">
                <button className="btn btn-sm" onClick={() => { setQuery(''); setRoleFilter(''); setFederadoFilter('all'); setCurrentPage(1); }}>Limpiar</button>
              </div>
            </div>
            <div className="overflow-x-auto flex flex-col justify-center">
              {/* Paginación: calcular usuarios a mostrar */}
              {(() => {
                const filtered = usuarios?.filter(matchesFilters) || [];
                const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
                const startIdx = (currentPage - 1) * USERS_PER_PAGE;
                const endIdx = startIdx + USERS_PER_PAGE;
                const pageUsers = filtered.slice(startIdx, endIdx);
                return <>
                  <table className="table w-full">
                    <thead>
                      <tr className="text-gray-300">
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageUsers.map((usuario) => {
                        const RolIcon = getRolIcon(usuario.rol);
                        return (
                          <tr key={usuario.id} className={`text-white ${usuario.estado == 'inactivo' ? 'opacity-50' : ''}`}>
                            <td>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolColor(usuario.rol)} flex items-center gap-1`}>
                                  <RolIcon className="w-3 h-3" />
                                  {usuario.rol}
                                </span>
                                {usuario.estado == 'federacion_pendiente' && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                                    <Clock className="w-3 h-3" />
                                    Esperando Federacion
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" style={{ color: '#4AC0E4' }} />
                                {usuario.nombre} {usuario.apellido}
                              </div>
                            </td>
                            <td className="text-white max-w-md">
                              <p className="truncate">{usuario.email}</p>
                              <p className="text-xs text-gray-400 flex" >
                                <CalendarFold className="w-4 h-4 mr-2" style={{ color: '#4AC0E4', display: 'inline' }} />
                                {usuario.nacimiento} ({calcularEdad(usuario.nacimiento)} años)
                              </p>
                              {/* Federation state */}
                              {usuario.rol === "federado" && (() => {
                                const fecha = usuario.validoHasta ? new Date(usuario.validoHasta) : null;
                                if (!fecha) {
                                  return <p className="text-xs mt-1 text-yellow-300">Federado (sin fecha de vencimiento)</p>;
                                }
                                const isExpired = fecha < new Date();
                                return (
                                  <p className={`text-xs mt-1 ${isExpired ? 'text-red-400 font-semibold' : 'text-green-300'}`}>
                                    Federado hasta: {fecha.toLocaleDateString()} {isExpired ? '(vencida)' : ''}
                                  </p>
                                );
                              })()}
                            </td>
                            <td>
                              {/* Edit button */}
                              <button className="btn btn-primary btn-sm mr-2 w-32" onClick={() => { setEditingUser(usuario); setModalEdicion(usuario.id); }}>
                                <Pencil className="w-4 h-4 mr-2 inline" /> Editar
                              </button>

                              {/* Federar/Renovar */}
                              {usuario.rol !== "administrador" && (
                                <button
                                  disabled={usuario.estado === "federacion_pendiente"}
                                  className="btn btn-sm btn-info mr-2 w-32"
                                  onClick={() => { setEditingUser(usuario); setFederarModalOpen(true); }}
                                >
                                  {usuario.rol === 'federado' ? 'Renovar' : 'Federar'}
                                </button>
                              )}

                              {/* Block / Unblock */}
                              {usuario.estado === 'inactivo' ? (
                                <button
                                  onClick={() => setModalDesbloqueo(usuario.id)}
                                  className="btn btn-sm w-32"
                                  style={{ backgroundColor: '#4AC0E4', borderColor: '#4AC0E4', color: 'white' }}
                                >
                                  REHABILITAR
                                </button>
                              ) : (
                                <button className="btn btn-sm btn-warning mr-2 w-32" onClick={() => setModalBloqueo(usuario.id)}>
                                  <OctagonAlertIcon className="w-4 h-4 mr-2 inline text-orange-400"/> Bloquear
                                </button>
                              )}

                              {/* Delete */}
                              {/* <button className="btn btn-sm btn-error ml-2 w-32" onClick={() => setModalEliminacion(usuario.id)}>
                                <Trash2 className="w-4 h-4 mr-2 inline" /> Eliminar
                              </button> */}
                            </td>
                          </tr>
                        );
                      })}
                      {pageUsers.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center text-gray-400 py-4">
                            No se han encontrado usuarios.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {/* Controles de paginación */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      className="btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Anterior
                    </button>
                    <span className="text-white">Página {currentPage} de {totalPages}</span>
                    <button
                      className="btn btn-sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </>;
              })()}
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

    {/* Modals */}
    <ConfirmActionModal
      open={!!modalBloqueo}
      title="Bloquear usuario"
      message={
        usuarios.find(u => u.id === modalBloqueo)
          ? `Estás seguro que deseas bloquear al usuario ${usuarios.find(u => u.id === modalBloqueo).nombre} ${usuarios.find(u => u.id === modalBloqueo).apellido}?\nEl mismo no podrá iniciar sesión hasta que sea reactivado manualmente.`
          : 'Estás seguro que deseas bloquear al usuario?'
      }
      confirmLabel="Bloquear"
      loading={confirmLoading}
      onConfirm={() => bloquearUsuario(modalBloqueo)}
      onCancel={() => setModalBloqueo(null)}
    />

    <ConfirmActionModal
      open={!!modalDesbloqueo}
      title="Rehabilitar usuario"
      message={
        usuarios.find(u => u.id === modalDesbloqueo)
          ? `Estás seguro que deseas rehabilitar al usuario ${usuarios.find(u => u.id === modalDesbloqueo).nombre} ${usuarios.find(u => u.id === modalDesbloqueo).apellido}?\nEl mismo podrá iniciar sesión nuevamente.`
          : 'Estás seguro que deseas rehabilitar al usuario?'
      }
      confirmLabel="Rehabilitar"
      loading={confirmLoading}
      onConfirm={() => desbloquearUsuario(modalDesbloqueo)}
      onCancel={() => setModalDesbloqueo(null)}
    />

    <ConfirmActionModal
      open={!!modalEliminacion}
      title="Eliminar usuario"
      message={
        usuarios.find(u => u.id === modalEliminacion)
          ? `Estás seguro que deseas eliminar al usuario ${usuarios.find(u => u.id === modalEliminacion).nombre} ${usuarios.find(u => u.id === modalEliminacion).apellido}?\nTodos los datos del mismo serán eliminados.`
          : 'Estás seguro que deseas eliminar al usuario? Todos los datos serán eliminados.'
      }
      confirmLabel="Eliminar"
      loading={confirmLoading}
      onConfirm={() => eliminarUsuario(modalEliminacion)}
      onCancel={() => setModalEliminacion(null)}
    />

    <EditUserModal
      open={!!modalEdicion}
      usuario={editingUser}
      onCancel={() => { setModalEdicion(null); setEditingUser(null); }}
      onSave={(payload) => saveEditedUser(editingUser?.id, payload)}
    />

    <FederarUsuarioModal
      open={federarModalOpen}
      usuario={editingUser}
      onClose={() => { setFederarModalOpen(false); setEditingUser(null); }}
      onFederar={(id, planId) => federarUsuario(id, planId)}
    />
    {/* end page container */}
  </>);
};

export default AdministracionUsuarios;
