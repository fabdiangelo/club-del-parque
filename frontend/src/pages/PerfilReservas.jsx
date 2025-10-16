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

    const activarAlerta = (mensaje, tipo = 'error') => {
        setMensajeAlerta(mensaje);
        setMostrarAlerta(true);
        setTimeout(() => {
            setMostrarAlerta(false);
            setMensajeAlerta('');
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
                            const res = await fetch(`/api/usuarios/${jugadorId}`, {
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
                                <p className="text-gray-600">ID: {reserva.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    className="btn btn-outline"
                                    onClick={() => navigate('/reservas')}
                                >
                                    ← Volver
                                </button>
                            </div>
                        </div>

                        {/* Estado y tipo */}
                        <div className="flex gap-4 mb-4">
                            <div className="badge badge-lg">
                                {reserva.estado === 'confirmada' && <span className="badge badge-success">Confirmada</span>}
                                {reserva.estado === 'pendiente' && <span className="badge badge-warning">Pendiente</span>}
                                {reserva.estado === 'rechazada' && <span className="badge badge-error">Rechazada</span>}
                            </div>
                            <div className="badge badge-lg">
                                {reserva.esCampeonato ? (
                                    <span className="badge badge-warning">🏆 Campeonato</span>
                                ) : (
                                    <span className="badge badge-info">👤 Recreativo</span>
                                )}
                            </div>
                            <div className="badge badge-lg">
                                <span className="badge badge-outline">
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
                            
                            {/* Cancha */}
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

                        {/* Jugadores */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Jugadores Participantes
                                <span className="ml-2 text-sm text-gray-500">
                                    ({jugadoresSeleccionados.length}/{reserva?.tipoPartido === 'singles' ? '2' : '4'})
                                </span>
                            </h2>

                            {/* Lista de jugadores */}
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

                        {/* Información Adicional */}
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

                {/* Alertas */}
                {mostrarAlerta && (
                    <div className="toast toast-top toast-center">
                        <div className="alert alert-error">
                            <span>{mensajeAlerta}</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default PerfilReservas