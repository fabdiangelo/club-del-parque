import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import NavbarBlanco from '../components/NavbarBlanco';

function PerfilReservas() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reserva, setReserva] = useState(null);
    const [canchas, setCanchas] = useState([]);
    const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensajeAlerta, setMensajeAlerta] = useState('');
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [tipoAlerta, setTipoAlerta] = useState('');


    const getJugadorById = async (idUsuario) => {
        try {
            const response = await fetch(`api/usuarios/${idUsuario}`);
        
            if(!response.ok) return;

            const data = await response.json();

            return data;

        } catch(error) {
            console.error(error);
        }
    }

    const confirmarReserva = async () => {
        try {
            const response = await fetch(`/api/reservas/${id}/confirmar`, {
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

        } catch(error) {
            activarAlerta('Error al aceptar la reserva');
        }
    }

    const rechazarReserva = async () => {
        try {
            const response = await fetch(`/api/reservas/${id}/rechazar`, {
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

        } catch(error) {
            activarAlerta('Error al rechazar la reserva');
        }
    }

    const habilitarReserva = async () => {
        try {
            const response = await fetch(`/api/reservas/${id}/habilitar`, {
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

        } catch(error) {
            activarAlerta('Error al habilitar la reserva');
        }
    }

    const deshabilitarReserva = async () => {
        try {   
            const response = await fetch(`/api/reservas/${id}/deshabilitar`, {
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
        } catch(error) {
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

    const fetchReserva = async () => {
        try {
            const response = await fetch(`/api/reservas/${id}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Reserva no encontrada');
            }

            const data = await response.json();
            setReserva(data);
            
            // Cargar jugadores seleccionados si existen
            if (data.jugadoresIDS && data.jugadoresIDS.length > 0) {
                const jugadoresData = await Promise.all(
                    data.jugadoresIDS.map(async (jugadorId) => {
                        try {
                            const res = await fetch(`/api/federados/${jugadorId}`, {
                                credentials: 'include'
                            });
                            return res.ok ? await res.json() : null;
                        } catch {
                            return null;
                        }
                    })
                );
                setJugadoresSeleccionados(jugadoresData.filter(Boolean));
            }
            
            setLoading(false);
        } catch (error) {
            activarAlerta(error.message);
            setLoading(false);
        }
    };

    const fetchCanchas = async () => {
        try {
            const response = await fetch('/api/canchas', {
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
                        <div className="loading loading-spinner loading-lg"></div>
                        <p className="mt-4 text-gray-600">Cargando reserva...</p>
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
                            onClick={() => navigate('/reservas')}
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
            <div className="bg-white min-h-screen bg-gray-50 py-8" style={{ marginTop: '50px'}}>
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-lg mb-6 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Perfil de Reserva
                                </h1>
                                <p className="text-gray-600">ID: {id}</p>
                                <p className={reserva.deshabilitar ? 'text-red-600' : 'text-green-700'}>{reserva.deshabilitar ? 'Deshabilitada' : 'Habilitada'}</p>
                                
                            </div>
                            <div className="flex align-items-center gap-2">

                                {
                                    !reserva.deshabilitar ? (<button style={{backgroundColor: 'red', padding: '8px 22px', color: 'white', cursor: 'pointer', borderRadius: '5px'}} onClick={() => deshabilitarReserva()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>

                                </button>) : (

                                    <button style={{backgroundColor: 'green', padding: '8px 22px', color: 'white', cursor: 'pointer', borderRadius: '5px'}} onClick={() => habilitarReserva()}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>
</button>
                                )
                                }

                                
                                <button 
                                    className="btn btn-outline"
                                    onClick={() => navigate('/reservas')}
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>

                        {!reserva.deshabilitar && reserva.estado === 'pendiente' && (
                                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}} className='py-5'>
                                    <button style={{padding: '8px 16px', borderRadius: '5px', backgroundColor: '#4caf50', color: 'white', cursor: 'pointer'}} onClick={() => confirmarReserva()}>Aceptar </button>
                                    <button style={{padding: '8px 16px', borderRadius: '5px', backgroundColor: '#f44336', color: 'white', cursor: 'pointer'}} onClick={() => rechazarReserva()}>Rechazar</button>
                                </div>
                            )}


                        <div className="flex gap-4 mb-4" style={{fontSize: '11px'}}>
                            
                            
                            <div style={{padding: '8px 16px', borderRadius: '50px', backgroundColor: reserva.estado === 'confirmada' ? '#d1fae5' : reserva.estado === 'pendiente' ? '#fef3c7' : '#fee2e2', color: reserva.estado === 'confirmada' ? '#065f46' : reserva.estado === 'pendiente' ? '#92400e' : '#991b1b'}}>
                                {reserva.estado === 'confirmada' && <span className="">Confirmada</span>}
                                {reserva.estado === 'pendiente' && <span className="">Pendiente</span>}
                                {reserva.estado === 'rechazada' && <span className="">Rechazada</span>}
                            </div>
                            <div className="" style={{padding: '8px 16px', borderRadius: '50px', backgroundColor: reserva.esCampeonato ? '#e0e7ff' : '#30c9d4ff', color: reserva.esCampeonato ? '#eeecffff' : '#065f46'}}>
                                {reserva.esCampeonato ? (
                                    <span className="">🏆 Campeonato</span>
                                ) : (
                                    <span className="">Recreativo</span>
                                )}
                            </div>
                            <div style={{padding: '8px 16px', borderRadius: '50px', backgroundColor: '#e0e7ff', color: '#3730a3'}}>
                                <span className="">
                                    {reserva.tipoPartido === 'singles' ? '1v1 Singles' : '2v2 Dobles'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                            <div className="form-control mb-4">

                                
                                <label className="label">
                                    <span className="label-text font-medium">Cancha</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {canchas.find(c => c.id === reserva.canchaId)?.nombre || 'Cancha no encontrada'}
                                </p>
                            </div>

                            {/* Fecha y Hora */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-medium">Fecha y Hora</span>
                                </label>
                                <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                    {new Date(reserva.fechaHora).toLocaleString('es-ES')}
                                </p>
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
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Jugadores Participantes
                                <span className="ml-2 text-sm text-gray-500">
                                    ({jugadoresSeleccionados.length}/{reserva?.tipoPartido === 'singles' ? '2' : '4'})
                                </span>
                            </h2>

                            <div className="space-y-3 mb-4">
                                {jugadoresSeleccionados.map((jugador, index) => (
                                    <div key={jugador.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {(jugador.nombre || jugador.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{jugador.nombre || 'Sin nombre'}</p>
                                                <p className="text-sm text-gray-500">{jugador.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Información Adicional</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Autor de la Reserva</span>
                                    </label>
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                        {user?.displayName || user?.email || 'Usuario actual'}
                                    </p>
                                </div>

                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Quien Paga</span>
                                    </label>
                                    <p className="text-gray-800 p-3 bg-gray-50 rounded">
                                        {jugadoresSeleccionados.find(j => j.id === reserva.quienPaga)?.nombre || 'Autor de la reserva'}
                                    </p>
                                </div>

                                {reserva.partidoId && (
                                    <div>
                                        <label className="label">
                                            <span className="label-text font-medium">ID del Partido</span>
                                        </label>
                                        <p className="text-gray-800 p-3 bg-gray-50 rounded font-mono text-sm">
                                            {reserva.partidoId}
                                        </p>
                                    </div>
                                )}

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
                    </div>
                </div>

                {mostrarAlerta && (
    <div className="toast toast-bottom toast-start">
        <div className={`alert alert-${tipoAlerta}`}>
            <span>{mensajeAlerta}</span>
        </div>
    </div>
)}
            </div>
        </>
    );
}

export default PerfilReservas