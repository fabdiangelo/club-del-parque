import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import NavbarBlanco from '../components/NavbarBlanco';

function PerfilReservas() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reserva, setReserva] = useState(null);
    const [partidoOriginal, setPartidoOriginal] = useState(null);
    const [canchas, setCanchas] = useState([]);
    const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensajeAlerta, setMensajeAlerta] = useState('');
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [tipoAlerta, setTipoAlerta] = useState('');

    // Estados para edición
    const [editando, setEditando] = useState(false);
    const [fechaEdit, setFechaEdit] = useState('');
    const [horaEdit, setHoraEdit] = useState('');




    const confirmarReserva = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/confirmar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log(errorText)
                activarAlerta(errorText || 'Error al aceptar la reserva');
                return;
            }

            const data = await response.json();
            console.log(data);
            activarAlerta('Reserva aceptada exitosamente', 'success');
            await fetchReserva();

        } catch (error) {
            activarAlerta('Error al aceptar la reserva');
        }
    }

    const rechazarReserva = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/rechazar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log(errorText)
                activarAlerta(errorText || 'Error al rechazar la reserva');
                return;
            }

            const data = await response.json();
            console.log(data);
            activarAlerta('Reserva rechazada exitosamente', 'success');
            await fetchReserva();

        } catch (error) {
            activarAlerta('Error al rechazar la reserva');
        }
    }

    const habilitarReserva = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/habilitar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (!response.ok) {
                const errorText = await response.text();
                console.log(errorText)
                activarAlerta(errorText || 'Error al habilitar la reserva');
                return;
            }

            const data = await response.json();
            console.log(data);
            activarAlerta('Reserva habilitada exitosamente', 'success');
            await fetchReserva();

        } catch (error) {
            activarAlerta('Error al habilitar la reserva');
        }
    }

    const deshabilitarReserva = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/deshabilitar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (!response.ok) {
                const errorText = await response.text();
                console.log(errorText)
                activarAlerta(errorText || 'Error al deshabilitar la reserva');
                return;
            }

            const data = await response.json();
            console.log(data);
            activarAlerta('Reserva deshabilitada exitosamente', 'success');
            await fetchReserva();
        } catch (error) {
            console.error(error);
            activarAlerta('Error al deshabilitar la reserva');
        }
    }

    const activarAlerta = (mensaje, tipo = 'error') => {
        setMensajeAlerta(mensaje);
        setMostrarAlerta(true);
        setTipoAlerta(tipo);
        setTimeout(() => {
            setMostrarAlerta(false);
            setMensajeAlerta('');
            setTipoAlerta('');
        }, 3000);
    }

    const cancelarAceptacion = async () => {
        if (!partidoOriginal) return;

        try {
            const partidoActualizado = { ...partidoOriginal };

            // Buscar y modificar la propuesta aceptada
            if (partidoActualizado.disponibilidades?.propuestas) {
                partidoActualizado.disponibilidades.propuestas = partidoActualizado.disponibilidades.propuestas.map(p => {
                    if (p.aceptada) {
                        return { ...p, aceptada: false };
                    }
                    return p;
                });
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(partidoActualizado)
            });

            if (!response.ok) {
                const errorText = await response.text();
                activarAlerta(errorText || 'Error al cancelar aceptación');
                return;
            }

            activarAlerta('Aceptación cancelada exitosamente', 'success');
            await fetchReserva(); // Recargar datos
        } catch (error) {
            console.error(error);
            activarAlerta('Error al cancelar aceptación');
        }
    }

    const guardarCambios = async () => {
        if (!partidoOriginal || !fechaEdit || !horaEdit) {
            activarAlerta('Debe completar fecha y hora');
            return;
        }

        try {
            const partidoActualizado = { ...partidoOriginal };
            const nuevoInicio = new Date(`${fechaEdit}T${horaEdit}`);
            const duracionMs = reserva.duracion * 60000;
            const nuevoFin = new Date(nuevoInicio.getTime() + duracionMs);

            // Actualizar propuesta aceptada
            let propuestaEncontrada = false;
            if (partidoActualizado.disponibilidades?.propuestas) {
                partidoActualizado.disponibilidades.propuestas = partidoActualizado.disponibilidades.propuestas.map(p => {
                    if (p.aceptada) {
                        propuestaEncontrada = true;
                        return {
                            ...p,
                            fechaHoraInicio: nuevoInicio.toISOString(),
                            fechaHoraFin: nuevoFin.toISOString(),
                            fecha: fechaEdit,
                            horaInicio: horaEdit,
                            // Recalcular hora fin string si es necesario, pero ISO es lo importante
                        };
                    }
                    return p;
                });
            }

            // Si no estaba en propuestas, actualizar root (fallback)
            if (!propuestaEncontrada || !partidoActualizado.disponibilidades?.propuestas) {
                partidoActualizado.fechaHoraInicio = nuevoInicio.toISOString();
                partidoActualizado.fechaHoraFin = nuevoFin.toISOString();
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(partidoActualizado)
            });

            if (!response.ok) {
                activarAlerta('Error al actualizar fecha y hora');
                return;
            }

            activarAlerta('Cambios guardados exitosamente', 'success');
            setEditando(false);
            await fetchReserva();

        } catch (error) {
            console.error(error);
            activarAlerta('Error al guardar cambios');
        }
    }

    const fetchReserva = async () => {
        try {
            // Fetch de partido en lugar de reserva
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Reserva/Partido no encontrada');
            }

            const partido = await response.json();
            setPartidoOriginal(partido);

            // Buscar la propuesta aceptada
            const propuestaAceptada = partido.disponibilidades?.propuestas?.find(p => p.aceptada === true);

            // Calcular duración en minutos
            let duracion = 90; // default
            let fechaHora = null;

            if (propuestaAceptada) {
                fechaHora = propuestaAceptada.fechaHoraInicio;
                if (propuestaAceptada.fechaHoraInicio && propuestaAceptada.fechaHoraFin) {
                    const inicio = new Date(propuestaAceptada.fechaHoraInicio);
                    const fin = new Date(propuestaAceptada.fechaHoraFin);
                    const diffMs = fin - inicio;
                    duracion = Math.floor(diffMs / 60000);
                }
            } else if (partido.fechaHoraInicio) {
                fechaHora = partido.fechaHoraInicio;
                // Si está en root, quizás tenga fechaFin
                if (partido.fechaHoraFin) {
                    const inicio = new Date(partido.fechaHoraInicio);
                    const fin = new Date(partido.fechaHoraFin);
                    duracion = Math.floor((fin - inicio) / 60000);
                }
            }

            const reservaMapped = {
                id: partido.id,
                canchaId: partido.canchaID,
                fechaHora: fechaHora,
                duracion: duracion,
                esCampeonato: true,
                tipoPartido: partido.tipoPartido,
                estado: 'confirmada', // Asumimos confirmada si estamos viendola
                jugadoresIDS: partido.jugadores,
                deshabilitar: false,
                numeroCancha: null,
                tipoCancha: partido.deporte,
                timestamp: partido.timestamp,
                partidoId: partido.id,
                quienPaga: partido.quienPaga // Si existe
            };

            setReserva(reservaMapped);

            // Inicializar estados de edición
            if (reservaMapped.fechaHora) {
                const dateObj = new Date(reservaMapped.fechaHora);
                // Ajuste simple para inputs date/time locales
                // Obtener YYYY-MM-DD
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                setFechaEdit(`${yyyy}-${mm}-${dd}`);

                // Obtener HH:MM
                const hh = String(dateObj.getHours()).padStart(2, '0');
                const min = String(dateObj.getMinutes()).padStart(2, '0');
                setHoraEdit(`${hh}:${min}`);
            }

            // Cargar jugadores seleccionados si existen
            if (reservaMapped.jugadoresIDS && reservaMapped.jugadoresIDS.length > 0) {
                const jugadoresData = await Promise.all(
                    reservaMapped.jugadoresIDS.map(async (jugadorId) => {
                        try {
                            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/federados/${jugadorId}`, {
                                credentials: 'include'
                            });
                            // Intentar endpoint de federados, si falla probar usuarios
                            if (res.ok) return await res.json();

                            // Fallback a usuarios generales si no es federado (o viceversa según estructura)
                            const resUser = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${jugadorId}`, {
                                credentials: 'include'
                            });
                            if (resUser.ok) return await resUser.json();

                            return { id: jugadorId, nombre: 'Usuario desconocido', email: '' };
                        } catch {
                            return { id: jugadorId, nombre: 'Error cargando', email: '' };
                        }
                    })
                );
                setJugadoresSeleccionados(jugadoresData.filter(Boolean));
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            activarAlerta(error.message);
            setLoading(false);
        }
    };

    const fetchCanchas = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/canchas`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCanchas(data);
            }
        } catch (error) {
            console.error('Error cargando canchas:', error);
        }
    };

    useEffect(() => {
        fetchReserva();
        fetchCanchas();
    }, [id]);

    if (loading) {
        return (
            <>
                <NavbarBlanco />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <p className="mt-4 text-gray-600">Cargando perfil...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!reserva) {
        return (
            <>
                <NavbarBlanco />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reserva no encontrada</h2>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/administracion')}
                        >
                            Volver a Reservas
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavbarBlanco />
            <div className="bg-white min-h-screen bg-gray-50 py-8" style={{ marginTop: '50px' }}>
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-lg mb-6 p-6">
                        <div className="flex justify-between flex-col lg:flex-row items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Perfil de Reserva
                                </h1>
                                <p className="text-gray-600" style={{ fontSize: '11px' }}>ID: {id}</p>
                                <p className={reserva.deshabilitar ? 'text-red-600' : 'text-green-700'} style={{ fontSize: '11px' }}>{reserva.deshabilitar ? 'Deshabilitada' : 'Habilitada'}</p>

                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                                <button
                                    className="btn btn-outline w-full sm:w-auto"
                                    onClick={() => navigate('/administracion')}
                                >
                                    ← Volver
                                </button>

                                <button
                                    className="btn btn-primary w-full sm:w-auto"
                                    onClick={() => setEditando(!editando)}
                                >
                                    {editando ? 'Cancelar Edición' : 'Editar Fecha/Hora'}
                                </button>

                                <button
                                    className="btn btn-error text-white w-full sm:w-auto"
                                    onClick={() => {
                                        if (window.confirm('¿Estás seguro de que deseas cancelar la aceptación de este partido? Pasará a estado pendiente/sin confirmar.')) {
                                            cancelarAceptacion();
                                        }
                                    }}
                                >
                                    Cancelar Aceptación
                                </button>
                            </div>
                        </div>




                        <div className="flex flex-wrap gap-4 mb-4" style={{ fontSize: '11px' }}>


                            <div style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: reserva.estado === 'confirmada' ? '#d1fae5' : reserva.estado === 'pendiente' ? '#fef3c7' : '#fee2e2', color: reserva.estado === 'confirmada' ? '#065f46' : reserva.estado === 'pendiente' ? '#92400e' : '#991b1b' }}>
                                {reserva.estado === 'confirmada' && <span className="">Confirmada</span>}
                                {reserva.estado === 'pendiente' && <span className="">Pendiente</span>}
                                {reserva.estado === 'rechazada' && <span className="">Rechazada</span>}
                            </div>
                            <div className="" style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: reserva.esCampeonato ? '#304485ff' : '#30c9d4ff', color: reserva.esCampeonato ? '#eeecffff' : '#065f46' }}>
                                {reserva.esCampeonato ? (
                                    <span className="">🏆 Campeonato</span>
                                ) : (
                                    <span className="">Recreativo</span>
                                )}
                            </div>
                            <div style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                                <span className="">
                                    {reserva.tipoPartido === 'singles' ? '1v1 Singles' : '2v2 Dobles'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="">
                        {/* Información Básica */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Información Básica</h2>


                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Estado</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {reserva.estado}
                                </p>
                            </div>





                            {/* Fecha y Hora */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Fecha y Hora</span>
                                </label>
                                {editando ? (
                                    <div className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded">
                                        <input
                                            type="date"
                                            className="input input-bordered input-sm w-full sm:w-auto"
                                            value={fechaEdit}
                                            onChange={(e) => setFechaEdit(e.target.value)}
                                        />
                                        <input
                                            type="time"
                                            className="input input-bordered input-sm w-full sm:w-auto"
                                            value={horaEdit}
                                            onChange={(e) => setHoraEdit(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-sm btn-success text-white w-full sm:w-auto"
                                            onClick={guardarCambios}
                                        >
                                            Guardar
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                        {new Date(reserva.fechaHora).toLocaleString('es-ES')}
                                    </p>
                                )}
                            </div>

                            {/* Duración */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Duración</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {reserva.duracion}
                                </p>
                            </div>

                            {/* Tipo de Partido */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Tipo de Partido</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {reserva.tipoPartido === 'singles' ? 'Singles (1 vs 1)' : 'Dobles (2 vs 2)'}
                                </p>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Fecha de Creación</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {reserva.timestamp ? new Date(reserva.timestamp).toLocaleString('es-ES') : 'No disponible'}
                                </p>
                            </div>
                        </div>




                    </div>
                </div >

                {mostrarAlerta && (
                    <div className="toast toast-bottom toast-start">
                        <div className={`alert alert-${tipoAlerta}`}>
                            <span>{mensajeAlerta}</span>
                        </div>
                    </div>
                )
                }
            </div >
        </>
    );
}

export default PerfilReservas