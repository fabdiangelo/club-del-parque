


import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import NavbarBlanco from '../components/NavbarBlanco';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

const Reservas = () => {

    const { user } = useAuth();
    const navigate = useNavigate();

    const [reservas, setReservas] = useState([]);
    const [mensajeAlerta, setMensajeAlerta] = useState('');
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [canchas, setCanchas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [modalFormulario, setModalFormulario] = useState(false);
    const [searchJugadores, setSearchJugadores] = useState('');
    const [jugadoresFiltrados, setJugadoresFiltrados] = useState([]);
    const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);

    const [reservasHabilitadas, setReservasHabilitadas] = useState([]);

    const [reservasDeshabilitadas, setReservasDeshabilitadas] = useState([]);

    const [dataForm, setDataForm] = useState({
        canchaId: '',
        fechaHora: '',
        duracion: '',
        esCampeonato: false,
        tipoPartido: 'singles',
        partidoId: '',
        jugadoresIDS: [],
        quienPaga: user?.uid,
        autor: user?.uid,
        estado: 'pendiente'
    })

    const verDetalles = (id) => {
        console.log("Ver detalles de la reserva:", id);

        // Navegar a la página de detalles
        navigate('/reservas/' + id);
    }


    const activarAlerta = (mensaje) => {
        setMensajeAlerta(mensaje);
        setMostrarAlerta(true);

        setTimeout(() => {
            setMostrarAlerta(false);
            setMensajeAlerta('');
        }, (2500));
    }


    const deshabilitarReserva = async (id) => {
        try {   
            const response = await fetch(`/api/reservas/${id}/deshabilitar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({reservaId: id})
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
            await fetchReservas();
        } catch(error) {
            console.error(error);
            activarAlerta('Error al deshabilitar la reserva');
        }
    }

    const fetchReservas = async () => {
        try {
            const response = await fetch(`api/reservas`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                activarAlerta(response.text());
                return;
            }

            const data = await response.json();
            setReservas(data);
            console.log(data);

            data.map((d) => {
                if(d.deshabilitar === true) {
                    setReservasDeshabilitadas(oldArray => [...oldArray, d]);
                } else {
                    setReservasHabilitadas(oldArray => [...oldArray, d]);
                }
            })

        } catch (error) {
            activarAlerta(error);
        }
    }


    const crearReserva = async (nuevaReserva) => {
        try {
            if (!nuevaReserva.canchaId) {
                activarAlerta("Debe seleccionar una cancha");
                return;
            }
            if (!nuevaReserva.fechaHora) {
                activarAlerta("Debe seleccionar fecha y hora");
                return;
            }
            if (!nuevaReserva.duracion) {
                activarAlerta("Debe seleccionar la duración");
                return;
            }
            if (!nuevaReserva.autor) {
                activarAlerta("Debe seleccionar el autor de la reserva");
                return;
            }
            if (!nuevaReserva.jugadoresIDS || nuevaReserva.jugadoresIDS.length === 0) {
                activarAlerta("Debe agregar al menos un jugador");
                return;
            }

            // Validar número correcto de jugadores según tipo
            const requiredPlayers = nuevaReserva.tipoPartido === 'singles' ? 2 : 4;
            if (nuevaReserva.jugadoresIDS.length !== requiredPlayers) {
                activarAlerta(`Para ${nuevaReserva.tipoPartido} se requieren exactamente ${requiredPlayers} jugadores`);
                return;
            }

            // Limpiar campos vacíos para evitar errores en el backend
            const reservaLimpia = {
                canchaId: nuevaReserva.canchaId,
                fechaHora: nuevaReserva.fechaHora,
                duracion: nuevaReserva.duracion,
                esCampeonato: nuevaReserva.esCampeonato || false,
                tipoPartido: nuevaReserva.tipoPartido || 'singles',
                jugadoresIDS: nuevaReserva.jugadoresIDS,
                quienPaga: nuevaReserva.quienPaga || nuevaReserva.autor,
                autor: nuevaReserva.autor,
                estado: 'confirmada'
            };

            console.log(reservaLimpia);

            if (nuevaReserva.partidoId && nuevaReserva.partidoId.trim() !== '') {
                reservaLimpia.partidoId = nuevaReserva.partidoId;
            }

            console.log("NUEVA RESERVA", reservaLimpia);
            console.log("DATOS DEL FORMULARIO", dataForm);

            const response = await fetch(`api/reservas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(reservaLimpia),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log("Error del servidor:", errorText);
                activarAlerta(errorText);
                return;
            }
                

            const data = await response.json();
            console.log("Respuesta del backend:", data);
            
            // En lugar de agregar solo el nuevo elemento, refrescar toda la lista
            // para asegurar que tenemos la estructura correcta
            await fetchReservas();
            
            activarAlerta("Reserva creada exitosamente");
        }

        catch (error) {
            console.error(error);
            activarAlerta(error);
        }
    }

    const fetchCanchas = async () => {
        try {
            const response = await fetch(`api/canchas`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if(!response.ok) return activarAlerta(response.text());

            const data = await response.json();
            setCanchas(data);
        } catch (error) {
            console.log(error);
            activarAlerta(error);
        }
    }

    const editarReserva = async (reservaEditada) => {
        try {

            const response = await fetch(`api/reservas/${reservaEditada.id}`, {
                method: 'PUT',
                headers: 'Content-Type: application/json',
                credentials: 'include'
            });

            if (!response.ok) {
                activarAlerta(response.text());
                return;
            }


            const data = response.json();

            const reservasEditadas = reservas.map((r) => {
                if (r.id == data.id) {
                    r = data;
                }
            })

            setReservas(reservasEditadas);
        } catch (error) {
            console.error(error);
            activarAlerta(error);
        }
    }


    const confirmarReserva = async (id) => {

        try {

            const response = await fetch(`api/reservas/${id}/confirmar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',

                },
                credentials: 'include'
            });

            if (!response.ok) {
                activarAlerta(error);
                return;
            }

            const data = await response.json();
            console.log(data);
            console.log("Se ha confirmado la reserva");

        } catch (error) {
            console.info(error);
            activarAlerta(error);
        }
    }


    const rechazarReserva = async (id) => {

        try {

            const response = await fetch(`api/reservas/${id}/rechazar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',

                },
                credentials: 'include'
            });

            if (!response.ok) {
                activarAlerta(error);
                return;
            }

            const data = await response.json();
            console.log(data);
            console.log("Se ha rechazado la reserva");

        } catch (error) {
            console.info(error);
            activarAlerta(error);
        }
    }

    const fetchUsuarios = async () => {
        try {
            const response = await fetch(`api/usuarios`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) return activarAlerta(response.text());

            const data = await response.json();
            setUsuarios(data);
        } catch (error) {
            activarAlerta(error);
        }
    }

    const buscarJugadores = (texto) => {
        if (!texto.trim()) {
            setJugadoresFiltrados([]);
            return;
        }
        const filtrados = usuarios.filter(usuario => 
            !jugadoresSeleccionados.some(j => j.id === usuario.id) &&
            (usuario.nombre?.toLowerCase().includes(texto.toLowerCase()) ||
            usuario.email?.toLowerCase().includes(texto.toLowerCase()))
        );
        setJugadoresFiltrados(filtrados.slice(0, 5));
    }

    const agregarJugador = (usuario) => {
        const maxJugadores = dataForm.tipoPartido === 'singles' ? 2 : 4;
        
        if (jugadoresSeleccionados.length >= maxJugadores) {
            activarAlerta(`Para ${dataForm.tipoPartido} solo se permiten ${maxJugadores} jugadores`);
            return;
        }
        
        const nuevosJugadores = [...jugadoresSeleccionados, usuario];
        setJugadoresSeleccionados(nuevosJugadores);
        setDataForm({...dataForm, jugadoresIDS: nuevosJugadores.map(j => j.id)});
        setSearchJugadores('');
        setJugadoresFiltrados([]);
    }

    const removerJugador = (usuarioId) => {
        const nuevosJugadores = jugadoresSeleccionados.filter(j => j.id !== usuarioId);
        setJugadoresSeleccionados(nuevosJugadores);
        setDataForm({...dataForm, jugadoresIDS: nuevosJugadores.map(j => j.id)});
    }

    const cambiarTipoPartido = (tipo) => {
        const maxJugadores = tipo === 'singles' ? 2 : 4;
        
        // Si hay más jugadores de los permitidos, remover los excedentes
        if (jugadoresSeleccionados.length > maxJugadores) {
            const jugadoresAjustados = jugadoresSeleccionados.slice(0, maxJugadores);
            setJugadoresSeleccionados(jugadoresAjustados);
            setDataForm({
                ...dataForm, 
                tipoPartido: tipo,
                jugadoresIDS: jugadoresAjustados.map(j => j.id)
            });
            activarAlerta(`Se removieron jugadores excedentes. ${tipo === 'singles' ? 'Singles' : 'Dobles'} permite máximo ${maxJugadores} jugadores.`);
        } else {
            setDataForm({...dataForm, tipoPartido: tipo});
        }
    }

    const limpiarFormulario = () => {
        setDataForm({
            canchaId: '',
            fechaHora: '',
            duracion: '',
            esCampeonato: false,
            tipoPartido: 'singles',
            partidoId: '',
            jugadoresIDS: [],
            quienPaga: user?.uid || '',
            autor: user?.uid || '',
            estado: 'pendiente'
        });
        setJugadoresSeleccionados([]);
        setSearchJugadores('');
        setJugadoresFiltrados([]);
    }

    useEffect(() => {
        fetchReservas();
        fetchCanchas();
        fetchUsuarios();
    }, []);

    // Actualizar autor cuando cambie el usuario
    useEffect(() => {
        if (user?.uid) {
            setDataForm(prev => ({
                ...prev,
                autor: user.uid,
                quienPaga: user.uid
            }));
        }
    }, [user]);

    return (
        <>


            {modalFormulario && (
                <dialog id="my_modal_3" className="modal modal-open">
                    <div className="modal-box max-w-2xl" style={{backgroundColor: 'white'}}>
                        <button 
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" 
                            onClick={() => setModalFormulario(false)}
                        >
                            ✕
                        </button>

                        {/* Header del modal */}
                        <div className='text-center mb-6'>
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v3a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1" />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-bold text-gray-800 mb-2'>Nueva Reserva</h3>
                            <p className='text-gray-600'>Completa la información para crear tu reserva</p>
                        </div>  

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Selección de Cancha */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium text-gray-700">
                                            
                                            Cancha
                                        </span>
                                    </label>
                                    <select 
                                        style={{backgroundColor: '#f0f0f0'}}
                                        className="select select-bordered w-full focus:select-primary"
                                        value={dataForm.canchaId}
                                        onChange={(e) => setDataForm({...dataForm, canchaId: e.target.value})}
                                    >
                                        <option value="">Seleccionar cancha</option>
                                        {canchas.map(cancha => (
                                            <option key={cancha.id} value={cancha.id}>
                                                🎾 {cancha.nombre || `Cancha ${cancha.numero}`} - {cancha.tipo || 'Tenis'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Duración */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium text-gray-700">
                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Duración
                                        </span>
                                    </label>
                                    <select 
                                        style={{backgroundColor: '#f0f0f0'}}
                                        className="select select-bordered w-full focus:select-primary"
                                        value={dataForm.duracion}
                                        onChange={(e) => setDataForm({...dataForm, duracion: e.target.value})}
                                    >
                                        <option value="">Seleccionar duración</option>
                                        <option value="1:00">1 hora</option>
                                        <option value="1:30">1.5 horas</option>
                                        <option value="2:00">2 horas</option>
                                        <option value="2:30">2.5 horas</option>
                                        <option value="3:00">3 horas</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fecha y Hora - Campo completo */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v3a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1" />
                                        </svg>
                                        Fecha y Hora de la Reserva
                                    </span>
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className="input input-bordered w-full focus:input-primary"
                                    style={{backgroundColor: '#f0f0f0'}}
                                    value={dataForm.fechaHora}
                                    onChange={(e) => setDataForm({...dataForm, fechaHora: e.target.value})}
                                />
                            </div>

                            {/* Tipo de Reserva */}
                            <div className="form-control" displa>
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">Tipo de Reserva</span>
                                </label>
                                <div className="flex gap-4" style={{border: '1px solid gray', borderRadius: '5px'}} >
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors" style={{backgroundColor: 'white'}}>
                                        <div className="flex items-center gap-3" style={{backgroundColor: 'white'}}>
                                            <input 
                                                style={{backgroundColor: 'white'}}
                                                type="radio" 
                                                name="tipoReserva"
                                                className="radio radio-primary"
                                                checked={!dataForm.esCampeonato}
                                                onChange={() => setDataForm({...dataForm, esCampeonato: false})}
                                            />
                                            <div>
                                                
                                                <div className="font-medium">Recreativo</div>
                                                <div className="text-sm text-gray-500">Juego casual</div>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors" style={{backgroundColor: 'white'}}>
                                        <div className="flex items-center gap-3">
                                            <input
                                            style={{backgroundColor: 'white'}} 
                                                type="radio" 
                                                name="tipoReserva"
                                                className="radio radio-warning"
                                                checked={dataForm.esCampeonato}
                                                onChange={() => setDataForm({...dataForm, esCampeonato: true})}
                                            />
                                            <div>
                                                
                                                <div className="font-medium">Campeonato</div>
                                                <div className="text-sm text-gray-500">Juego oficial</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Tipo de Partido */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Tipo de Partido
                                    </span>
                                </label>
                                <div className="flex gap-4" style={{border: '1px solid gray', borderRadius: '5px'}}>
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors" style={{backgroundColor: 'white'}}>
                                        <div className="flex items-center gap-3" style={{backgroundColor: 'white'}}>
                                            <input 
                                                style={{backgroundColor: 'white'}}
                                                type="radio" 
                                                name="tipoPartido"
                                                className="radio radio-success"
                                                checked={dataForm.tipoPartido === 'singles'}
                                                onChange={() => cambiarTipoPartido('singles')}
                                            />
                                            <div>
                                              
                                                <div className="font-medium">Singles</div>
                                                <div className="text-sm text-gray-500">1 vs 1</div>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-4 flex-1 hover:bg-base-300 transition-colors" style={{backgroundColor: 'white'}}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                style={{backgroundColor: 'white'}} 
                                                type="radio" 
                                                name="tipoPartido"
                                                className="radio radio-info"
                                                checked={dataForm.tipoPartido === 'dobles'}
                                                onChange={() => cambiarTipoPartido('dobles')}
                                            />
                                            <div>
                                                
                                                <div className="font-medium">Dobles</div>
                                                <div className="text-sm text-gray-500">2 vs 2</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Autor de la Reserva */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Autor de la Reserva
                                    </span>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="input input-bordered w-full bg-gray-100 cursor-not-allowed" 
                                        value={user?.nombre}
                                        readOnly
                                        disabled
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="label">
                                    <span className="label-text-alt text-gray-500">
                                        El autor es automáticamente el usuario actual y no se puede cambiar
                                    </span>
                                </div>
                            </div>

                            {/* Jugadores */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                       
                                        Jugadores Participantes
                                        <span className="ml-2 text-sm">
                                            ({jugadoresSeleccionados.length}/{dataForm.tipoPartido === 'singles' ? '2' : '4'})
                                        </span>
                                    </span>
                                </label>
                                
                                {/* Indicador de progreso */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                    <div 
                                        className={`h-2 rounded-full ${
                                            jugadoresSeleccionados.length === (dataForm.tipoPartido === 'singles' ? 2 : 4) 
                                                ? 'bg-green-500' 
                                                : 'bg-blue-500'
                                        }`}
                                        style={{
                                            width: `${(jugadoresSeleccionados.length / (dataForm.tipoPartido === 'singles' ? 2 : 4)) * 100}%`
                                        }}
                                    ></div>
                                </div>
                                
                                {/* Jugadores seleccionados */}
                                {jugadoresSeleccionados.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {jugadoresSeleccionados.map(jugador => (
                                            <div key={jugador.id} className="badge badge-primary gap-2">
                                                {jugador.nombre || jugador.email}
                                                <button 
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => removerJugador(jugador.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="input input-bordered w-full focus:input-primary" 
                                        style={{backgroundColor: '#f0f0f0'}}
                                        placeholder="Buscar y agregar jugadores..."
                                        value={searchJugadores}
                                        onChange={(e) => {
                                            setSearchJugadores(e.target.value);
                                            buscarJugadores(e.target.value);
                                        }}
                                    />
                                    {jugadoresFiltrados.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                            {jugadoresFiltrados.map(usuario => (
                                                <div 
                                                    key={usuario.id}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                                                    onClick={() => agregarJugador(usuario)}
                                                >
                                                    <div className="font-medium">{usuario.nombre || 'Sin nombre'}</div>
                                                    <div className="text-sm text-gray-500">{usuario.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ID del Partido (opcional) */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        ID del Partido (opcional)
                                    </span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full focus:input-primary" 
                                    style={{backgroundColor: '#f0f0f0'}}
                                    placeholder="ID del partido asociado (opcional)"
                                    value={dataForm.partidoId}
                                    onChange={(e) => setDataForm({...dataForm, partidoId: e.target.value})}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-gray-700">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        ID de Quien Paga
                                    </span>
                                </label>
                                <select 
                                    style={{backgroundColor: '#f0f0f0'}}
                                    className="select select-bordered w-full focus:select-primary"
                                    value={dataForm.quienPaga}
                                    onChange={(e) => setDataForm({...dataForm, quienPaga: e.target.value})}
                                >
                                    <option value="">Seleccionar quien paga</option>
                                    {dataForm.autor && (
                                        <option value={dataForm.autor}>Autor de la reserva</option>
                                    )}
                                    {jugadoresSeleccionados.map(jugador => (
                                        <option key={jugador.id} value={jugador.id}>
                                            {jugador.nombre || jugador.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-action justify-center pt-6">
                                <button 
                                    type="button"
                                    className="btn btn-primary btn-wide"
                                    onClick={async () => {
                                        try {
                                            await crearReserva(dataForm);
                                            limpiarFormulario();
                                            setModalFormulario(false);
                                        } catch (error) {
                                            // El error ya se maneja en crearReserva
                                            console.log("Error en creación:", error);
                                        }
                                    }}
                                >
                                    Crear Reserva
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setModalFormulario(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </dialog>
            )}


            <NavbarBlanco />
            <div style={{ height: '100vh', paddingTop: '0' }}>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className='container mx-auto'>

                        {reservas.length > 0 && reservasHabilitadas.length > 0 ? (
                            <div className='overflow-x-auto shadow-lg rounded-lg bg-white'>
                                <table className='table w-full'>
                                    <thead className='bg-gray-50'>
                                        <tr>
                                            <th className='font-semibold text-gray-700'></th>
                                            <th className='font-semibold text-gray-700'>Cancha</th>
                                            <th className='font-semibold text-gray-700'>Fecha & Hora</th>
                                            <th className='font-semibold text-gray-700'>Duración</th>
                                            <th className='font-semibold text-gray-700'>Estado</th>
                                            <th className='font-semibold text-gray-700'>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reservasHabilitadas.map((reserva, index) => (
                                            <tr key={reserva.id || index} className='hover:bg-gray-50 transition-colors'>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="mask mask-squircle h-12 w-12">
                                                                {reserva.esCampeonato ? (
                                                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
</svg>

                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
</svg>

                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            
                                                            <div className="text-sm opacity-100 text-gray-600">
                                                                {reserva.esCampeonato ? (
                                                                    <span className="badge badge-warning badge-sm" style={{color: 'white'}}>Campeonato</span>
                                                                ) : (
                                                                    <span className="badge badge-info badge-sm" style={{color: 'white'}}>Recreativo</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-medium text-gray-900">Cancha {reserva.numeroCancha || 1}</span>
                                                    <br />
                                                    <span className="text-sm text-gray-500">{reserva.tipoCancha || 'Tenis'}</span>
                                                </td>
                                                <td>
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900">
                                                            {reserva.fechaHora ? new Date(reserva.fechaHora).toLocaleDateString('es-ES') : 'No definida'}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {reserva.fechaHora ? new Date(reserva.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No definida'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge badge-outline">{reserva.duracion || '90'} min</span>
                                                </td>
                                                <td>
                                                    {reserva.estado === 'confirmada' && (
                                                        <span className="badge badge-success">Confirmada</span>
                                                    )}
                                                    {reserva.estado === 'pendiente' && (
                                                        <span className="badge badge-warning">Pendiente</span>
                                                    )}
                                                    {reserva.estado === 'rechazada' && (
                                                        <span className="badge badge-error">Rechazada</span>
                                                    )}
                                                    {!reserva.estado && (
                                                        <span className="badge badge-ghost">Sin estado</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        {reserva.estado === 'pendiente' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-success btn-xs"
                                                                    onClick={() => confirmarReserva(reserva.id)}
                                                                >
                                                                    Confirmar
                                                                </button>
                                                                <button
                                                                    className="btn btn-error btn-xs"
                                                                    onClick={() => rechazarReserva(reserva.id)}
                                                                >
                                                                    Rechazar
                                                                </button>
                                                            </>
                                                        )}

                                                        {reserva.deshabilitar == false && ( 
<div className="" onClick={() => deshabilitarReserva(reserva.id)} style={{backgroundColor: 'white', border: 'none', padding: 0, cursor: 'pointer'}}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>

                                                        </div>
                                                        )}

                                                        

                                                        <button className="btn btn-ghost btn-xs" onClick={() => verDetalles(reserva.id)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>

                                                            </button>
                                                        {reserva.estado === 'rechazada' && (
                                                            <span className="text-xs text-gray-400">Sin acciones</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                            :
                            (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v3a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
                                    <p className="text-gray-500">Cuando se realicen reservas, aparecerán aquí.</p>
                                    
                                </div>
                            )}
                    </div>
                </div>



                {/* Alerta flotante */}
                {mostrarAlerta && (
                    <div className="toast toast-top toast-center">
                        <div className="alert alert-error">
                            <span>{mensajeAlerta}</span>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-6 right-6 z-50">
                    <button 
                        className="btn btn-primary btn-circle w-14 h-14 shadow-2xl hover:scale-110 transition-all duration-300 group"
                        onClick={() => {
                            limpiarFormulario();
                            setModalFormulario(true);
                        }}
                        title="Crear nueva reserva"
                    >
                        <svg 
                            className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 4v16m8-8H4" 
                            />
                        </svg>
                    </button>
                </div>


            </div>

        </>
    )
}

export default Reservas