


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
    const [filtroActivo, setFiltroActivo] = useState('habilitadas');
    const [tipoAlerta, setTipoAlerta] = useState('');
    const [loading, setLoading] = useState(true);

    // Edit Modal States
    const [modalEdit, setModalEdit] = useState(false);
    const [selectedReserva, setSelectedReserva] = useState(null);
    const [fechaEdit, setFechaEdit] = useState('');
    const [horaEdit, setHoraEdit] = useState('');

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


    const activarAlerta = (mensaje, tipo = 'error') => {
        setMensajeAlerta(mensaje);
        setTipoAlerta(tipo);
        setMostrarAlerta(true);

        setTimeout(() => {
            setMostrarAlerta(false);
            setMensajeAlerta('');
            setTipoAlerta('');
        }, (2500));
    }


    const deshabilitarReserva = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/deshabilitar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ reservaId: id })
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
        } catch (error) {
            console.error(error);
            activarAlerta('Error al deshabilitar la reserva');
        }
    }

    const fetchReservas = async () => {
        try {
            setLoading(true);
            // Limpiar arrays antes de llenarlos
            setReservasHabilitadas([]);
            setReservasDeshabilitadas([]);

            // Fetch de partidos en lugar de reservas
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                activarAlerta(await response.text());
                return;
            }

            const data = await response.json();
            console.log("Partidos fetched:", data);


            const partidosAceptados = data.filter(partido =>
                partido?.disponibilidades?.propuestas && partido?.disponibilidades?.propuestas.some(propuesta => propuesta.aceptada)
            );

            console.log("PARTIDOS ACEPTADOS", partidosAceptados);

            const reservasMapped = partidosAceptados.map(partido => {
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
                    // Fallback si por alguna razón no está en propuestas pero está en root
                    fechaHora = partido.fechaHoraInicio;
                }

                return {
                    id: partido.id,
                    canchaId: partido.canchaID,
                    fechaHora: fechaHora,
                    duracion: duracion,
                    esCampeonato: true,
                    tipoPartido: partido.tipoPartido,
                    estado: 'confirmada',
                    jugadoresIDS: partido.jugadores,
                    deshabilitar: false,
                    numeroCancha: null, // Se resolverá cruzando con canchas
                    tipoCancha: partido.deporte, // 'tenis' o similar
                    originalData: partido // Guardamos el objeto original para ediciones
                };
            });

            console.log("Reservas mapeadas:", reservasMapped);
            setReservas(reservasMapped);

            const habilitadas = [];
            const deshabilitadas = [];

            reservasMapped.forEach((d) => {
                if (d.deshabilitar === true) {
                    deshabilitadas.push(d);
                } else {
                    habilitadas.push(d);
                }
            });

            setReservasHabilitadas(habilitadas);
            setReservasDeshabilitadas(deshabilitadas);

        } catch (error) {
            console.error(error);
            activarAlerta("Error obteniendo reservas/partidos");
        } finally {
            setLoading(false);
        }
    }

    // Función para obtener las reservas a mostrar según el filtro
    const getReservasAMostrar = () => {
        console.log("Filtro activo:", reservasHabilitadas);
        switch (filtroActivo) {
            case 'habilitadas':
                return reservasHabilitadas;
            case 'deshabilitadas':
                return reservasDeshabilitadas;
            case 'todas':
                return reservas;
            default:
                return reservasHabilitadas;
        }
    }


    const crearReserva = async (nuevaReserva) => {
        try {
            if (!nuevaReserva.canchaId) {
                console.log("Debe seleccionar una cancha");
                activarAlerta("Debe seleccionar una cancha", "error");
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas`, {
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

            await fetchReservas();

            activarAlerta("Reserva creada exitosamente", "success");
        }

        catch (error) {
            console.error(error);
            activarAlerta(error);
        }
    }

    const fetchCanchas = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/canchas`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) return activarAlerta(response.text());

            const data = await response.json();
            setCanchas(data);
        } catch (error) {
            console.log(error);
            activarAlerta(error);
        }
    }

    const editarReserva = async (reservaEditada) => {
        try {

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${reservaEditada.id}`, {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/confirmar`, {
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
            await fetchReservas();

        } catch (error) {
            console.info(error);
            activarAlerta(error);
        }
    }


    const rechazarReserva = async (id) => {

        try {

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/${id}/rechazar`, {
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
            await fetchReservas();

        } catch (error) {
            console.info(error);
            activarAlerta(error);
        }
    }

    const fetchUsuarios = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`, {
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
        setDataForm({ ...dataForm, jugadoresIDS: nuevosJugadores.map(j => j.id) });
        setSearchJugadores('');
        setJugadoresFiltrados([]);
    }

    const removerJugador = (usuarioId) => {
        const nuevosJugadores = jugadoresSeleccionados.filter(j => j.id !== usuarioId);
        setJugadoresSeleccionados(nuevosJugadores);
        setDataForm({ ...dataForm, jugadoresIDS: nuevosJugadores.map(j => j.id) });
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
            setDataForm({ ...dataForm, tipoPartido: tipo });
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

    const abrirModalEdicion = (reserva) => {
        setSelectedReserva(reserva);
        if (reserva.fechaHora) {
            const dateObj = new Date(reserva.fechaHora);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            setFechaEdit(`${yyyy}-${mm}-${dd}`);

            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');
            setHoraEdit(`${hh}:${min}`);
        } else {
            setFechaEdit('');
            setHoraEdit('');
        }
        setModalEdit(true);
    }

    const guardarEdicion = async () => {
        if (!selectedReserva || !selectedReserva.originalData || !fechaEdit || !horaEdit) {
            activarAlerta('Información incompleta');
            return;
        }

        try {
            const partidoActualizado = { ...selectedReserva.originalData };
            const nuevoInicio = new Date(`${fechaEdit}T${horaEdit}`);
            const duracionMs = selectedReserva.duracion * 60000;
            const nuevoFin = new Date(nuevoInicio.getTime() + duracionMs);

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
                            horaInicio: horaEdit
                        };
                    }
                    return p;
                });
            }

            if (!propuestaEncontrada) {
                partidoActualizado.fechaHoraInicio = nuevoInicio.toISOString();
                partidoActualizado.fechaHoraFin = nuevoFin.toISOString();
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${selectedReserva.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(partidoActualizado)
            });

            if (!response.ok) {
                activarAlerta('Error al actualizar fecha y hora');
                return;
            }

            activarAlerta('Cambios guardados exitosamente', 'success');
            setModalEdit(false);
            await fetchReservas();
        } catch (error) {
            console.error(error);
            activarAlerta('Error al guardar cambios');
        }
    }

    const cancelarAceptacionList = async (reserva) => {
        if (!reserva.originalData) return;

        if (!window.confirm('¿Estás seguro de que deseas cancelar la aceptación?')) return;

        try {
            const partidoActualizado = { ...reserva.originalData };

            if (partidoActualizado.disponibilidades?.propuestas) {
                partidoActualizado.disponibilidades.propuestas = partidoActualizado.disponibilidades.propuestas.map(p => {
                    if (p.aceptada) {
                        return { ...p, aceptada: false };
                    }
                    return p;
                });
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${reserva.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(partidoActualizado)
            });

            if (!response.ok) {
                activarAlerta('Error al cancelar aceptación');
                return;
            }

            activarAlerta('Aceptación cancelada exitosamente', 'success');
            await fetchReservas();
        } catch (error) {
            console.error(error);
            activarAlerta('Error al cancelar aceptación');
        }
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
                    <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto " style={{ backgroundColor: 'white' }}>
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
                            onClick={() => setModalFormulario(false)}
                        >
                            ✕
                        </button>

                        {/* Header del modal - más compacto */}
                        <div className='text-center mb-4'>
                            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v3a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1" />
                                </svg>
                            </div>
                            <h3 className='text-xl font-bold text-gray-800 mb-1'>Nueva Reserva</h3>
                            <p className='text-sm text-gray-600'>Completa la información para crear tu reserva</p>
                        </div>

                        <form className="space-y-4">
                            {/* Grid más compacto */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Selección de Cancha */}
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text text-sm font-medium text-gray-700">Cancha</span>
                                    </label>
                                    <select
                                        style={{ backgroundColor: '#f0f0f0' }}
                                        className="select select-bordered select-sm w-full focus:select-primary"
                                        value={dataForm.canchaId}
                                        onChange={(e) => setDataForm({ ...dataForm, canchaId: e.target.value })}
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
                                    <label className="label py-1">
                                        <span className="label-text text-sm font-medium text-gray-700">Duración</span>
                                    </label>
                                    <select
                                        style={{ backgroundColor: '#f0f0f0' }}
                                        className="select select-bordered select-sm w-full focus:select-primary"
                                        value={dataForm.duracion}
                                        onChange={(e) => setDataForm({ ...dataForm, duracion: e.target.value })}
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
                                <label className="label py-1">
                                    <span className="label-text text-sm font-medium text-gray-700">Fecha y Hora</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input input-bordered input-sm w-full focus:input-primary"
                                    style={{ backgroundColor: '#f0f0f0' }}
                                    value={dataForm.fechaHora}
                                    onChange={(e) => setDataForm({ ...dataForm, fechaHora: e.target.value })}
                                />
                            </div>

                            {/* Tipo de Reserva - más compacto */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-sm font-medium text-gray-700">Tipo de Reserva</span>
                                </label>
                                <div className="flex gap-2">
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-2 flex-1 hover:bg-base-300 transition-colors" style={{ backgroundColor: 'white' }}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="tipoReserva"
                                                className="radio radio-primary radio-sm"
                                                checked={!dataForm.esCampeonato}
                                                onChange={() => setDataForm({ ...dataForm, esCampeonato: false })}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">Recreativo</div>
                                                <div className="text-xs text-gray-500">Casual</div>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-2 flex-1 hover:bg-base-300 transition-colors" style={{ backgroundColor: 'white' }}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="tipoReserva"
                                                className="radio radio-warning radio-sm"
                                                checked={dataForm.esCampeonato}
                                                onChange={() => setDataForm({ ...dataForm, esCampeonato: true })}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">Campeonato</div>
                                                <div className="text-xs text-gray-500">Oficial</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Tipo de Partido - más compacto */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-sm font-medium text-gray-700">Tipo de Partido</span>
                                </label>
                                <div className="flex gap-2">
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-2 flex-1 hover:bg-base-300 transition-colors" style={{ backgroundColor: 'white' }}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="tipoPartido"
                                                className="radio radio-success radio-sm"
                                                checked={dataForm.tipoPartido === 'singles'}
                                                onChange={() => cambiarTipoPartido('singles')}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">Singles</div>
                                                <div className="text-xs text-gray-500">1 vs 1</div>
                                            </div>
                                        </div>
                                    </label>
                                    <label className="label cursor-pointer bg-base-200 rounded-lg p-2 flex-1 hover:bg-base-300 transition-colors" style={{ backgroundColor: 'white' }}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="tipoPartido"
                                                className="radio radio-info radio-sm"
                                                checked={dataForm.tipoPartido === 'dobles'}
                                                onChange={() => cambiarTipoPartido('dobles')}
                                            />
                                            <div>
                                                <div className="text-sm font-medium">Dobles</div>
                                                <div className="text-xs text-gray-500">2 vs 2</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Autor - más compacto */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-sm font-medium text-gray-700">Autor</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input input-bordered input-sm w-full bg-gray-100 cursor-not-allowed"
                                        value={user?.nombre || user?.email || 'Usuario actual'}
                                        readOnly
                                        disabled
                                    />
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Jugadores - más compacto */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-sm font-medium text-gray-700">
                                        Jugadores ({jugadoresSeleccionados.length}/{dataForm.tipoPartido === 'singles' ? '2' : '4'})
                                    </span>
                                </label>

                                {/* Barra de progreso más pequeña */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${jugadoresSeleccionados.length === (dataForm.tipoPartido === 'singles' ? 2 : 4)
                                            ? 'bg-green-500'
                                            : 'bg-blue-500'
                                            }`}
                                        style={{
                                            width: `${(jugadoresSeleccionados.length / (dataForm.tipoPartido === 'singles' ? 2 : 4)) * 100}%`
                                        }}
                                    ></div>
                                </div>

                                {/* Jugadores seleccionados - más compactos */}
                                {jugadoresSeleccionados.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {jugadoresSeleccionados.map(jugador => (
                                            <div key={jugador.id} className="badge badge-primary badge-sm gap-1">
                                                <span className="text-xs">{jugador.nombre || jugador.email}</span>
                                                <button
                                                    className="btn btn-ghost btn-xs p-0 w-3 h-3"
                                                    onClick={() => removerJugador(jugador.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Input de búsqueda */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input input-bordered input-sm w-full focus:input-primary"
                                        style={{ backgroundColor: '#f0f0f0' }}
                                        placeholder="Buscar jugadores..."
                                        value={searchJugadores}
                                        onChange={(e) => {
                                            setSearchJugadores(e.target.value);
                                            buscarJugadores(e.target.value);
                                        }}
                                    />
                                    {jugadoresFiltrados.length > 0 && (
                                        <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto">
                                            {jugadoresFiltrados.map(usuario => (
                                                <div
                                                    key={usuario.id}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b text-sm"
                                                    onClick={() => agregarJugador(usuario)}
                                                >
                                                    <div className="font-medium text-sm">{usuario.nombre || 'Sin nombre'}</div>
                                                    <div className="text-xs text-gray-500">{usuario.email}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Campos opcionales en accordion colapsable */}
                            <div className="collapse collapse-arrow bg-whie">
                                <input type="checkbox" />
                                <div className="collapse-title text-sm font-medium">
                                    Opciones adicionales (opcional)
                                </div>
                                <div className="collapse-content space-y-3">
                                    {/* ID del Partido */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text text-sm font-medium text-gray-700">ID del Partido</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm w-full focus:input-primary"
                                            style={{ backgroundColor: '#f0f0f0' }}
                                            placeholder="ID del partido (opcional)"
                                            value={dataForm.partidoId}
                                            onChange={(e) => setDataForm({ ...dataForm, partidoId: e.target.value })}
                                        />
                                    </div>

                                    {/* Quien Paga */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text text-sm font-medium text-gray-700">Quien Paga</span>
                                        </label>
                                        <select
                                            style={{ backgroundColor: '#f0f0f0' }}
                                            className="select select-bordered select-sm w-full focus:select-primary"
                                            value={dataForm.quienPaga}
                                            onChange={(e) => setDataForm({ ...dataForm, quienPaga: e.target.value })}
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
                                </div>
                            </div>

                            {/* Botones más compactos */}
                            <div className="modal-action justify-center pt-4 gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={async () => {
                                        try {
                                            await crearReserva(dataForm);
                                            limpiarFormulario();
                                            setModalFormulario(false);
                                        } catch (error) {
                                            console.log("Error en creación:", error);
                                        }
                                    }}
                                >
                                    Crear Reserva
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
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
            <div style={{ paddingTop: '0' }}>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className='container mx-auto'>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                            </div>
                        ) : reservas.length > 0 ? (
                            <div className='container mx-auto px-4'>

                                <span className="text-sm text-gray-500">
                                    Total: {reservas.length}
                                </span>



                                {getReservasAMostrar().length > 0 ? (
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
                                                {getReservasAMostrar().map((reserva, index) => (
                                                    <tr key={reserva.id || index} className={`hover:bg-gray-50 transition-colors ${reserva.deshabilitar ? 'opacity-60' : ''}`}>
                                                        <td>
                                                            <div className="flex items-center gap-3" style={{ cursor: 'pointer' }} onClick={() => verDetalles(reserva.id)}>
                                                                <div className="avatar">
                                                                    <div className="mask mask-squircle h-12 w-12">
                                                                        {reserva.esCampeonato ? (
                                                                            <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center`}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" className="size-6">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                                                                                </svg>
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center`}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" className="size-6">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm opacity-100 text-gray-600">
                                                                        {reserva.esCampeonato ? (
                                                                            <span className={`badge badge-sm ${reserva.deshabilitar ? 'badge-ghost' : 'badge-warning'}`} style={{ color: 'white' }}>
                                                                                Campeonato
                                                                            </span>
                                                                        ) : (
                                                                            <span className={`badge badge-sm ${reserva.deshabilitar ? 'badge-ghost' : 'badge-info'}`} style={{ color: 'white' }}>
                                                                                Recreativo
                                                                            </span>
                                                                        )}
                                                                        {reserva.deshabilitar && (
                                                                            <span className="badge badge-error badge-sm ml-1">Deshabilitada</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`font-medium ${reserva.deshabilitar ? 'text-gray-500' : 'text-gray-900'}`}>
                                                                {(() => {
                                                                    const canchaEncontrada = canchas.find(c => c.id == reserva.canchaId);
                                                                    if (canchaEncontrada) {
                                                                        return canchaEncontrada.nombre || `Cancha ${canchaEncontrada.numero}`;
                                                                    }
                                                                    return reserva.numeroCancha ? `Cancha ${reserva.numeroCancha}` : 'Sin asignar';
                                                                })()}
                                                            </span>
                                                            <br />
                                                            <span className="text-sm text-gray-500">
                                                                {(() => {
                                                                    const canchaEncontrada = canchas.find(c => c.id == reserva.canchaId);
                                                                    if (canchaEncontrada) return canchaEncontrada.tipo;
                                                                    return reserva.tipoCancha || '-';
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="text-sm">
                                                                <div className={`font-medium ${reserva.deshabilitar ? 'text-gray-500' : 'text-gray-900'}`}>
                                                                    {reserva.fechaHora ? new Date(reserva.fechaHora).toLocaleDateString('es-ES') : 'No definida'}
                                                                </div>
                                                                <div className="text-gray-500">
                                                                    {reserva.fechaHora ? new Date(reserva.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No definida'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-outline ${reserva.deshabilitar ? 'opacity-50' : ''}`}>
                                                                {reserva.duracion || '90'} min
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {reserva.estado === 'confirmada' && (
                                                                <span style={{ color: reserva.deshabilitar ? 'gray' : 'green' }}>Confirmada</span>
                                                            )}
                                                            {reserva.estado === 'pendiente' && (
                                                                <span style={{ color: reserva.deshabilitar ? 'gray' : 'orange' }}>Pendiente</span>
                                                            )}
                                                            {reserva.estado === 'rechazada' && (
                                                                <span style={{ color: reserva.deshabilitar ? 'gray' : 'red' }}>Rechazada</span>
                                                            )}
                                                            {!reserva.estado && (
                                                                <span>Sin estado</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <div className="flex gap-2 justify-center">
                                                                    <button
                                                                        className="text-blue-600 tooltip" style={{ cursor: 'pointer' }}
                                                                        data-tip="Editar Fecha/Hora"
                                                                        onClick={() => abrirModalEdicion(reserva)}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0h18M5.25 12h13.5h-13.5v6c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75v-6h-13.5Z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 15.75.75.75m-3.75 0 .75.75m-9.75 0 .75.75" />
                                                                        </svg>
                                                                    </button>

                                                                    <button
                                                                        className="text-red-600 tooltip" style={{ cursor: 'pointer' }}
                                                                        data-tip="Cancelar Aceptación"
                                                                        onClick={() => cancelarAceptacionList(reserva)}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>



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
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v1m0-1h6m-6 1v3a1 1 0 001 1h4a1 1 0 001-1V8m-6 0H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No hay reservas {filtroActivo === 'habilitadas' ? 'habilitadas' : filtroActivo === 'deshabilitadas' ? 'deshabilitadas' : ''}
                                        </h3>
                                        <p className="text-gray-500">
                                            {filtroActivo === 'habilitadas' && 'No se encontraron reservas habilitadas.'}
                                            {filtroActivo === 'deshabilitadas' && 'No se encontraron reservas deshabilitadas.'}
                                            {filtroActivo === 'todas' && 'Cuando se realicen reservas, aparecerán aquí.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
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



                {mostrarAlerta && (
                    <div className="toast toast-bottom toast-start">
                        <div className={`alert ${tipoAlerta === 'success' ? 'alert-success' : tipoAlerta === 'warning' ? 'alert-warning' : 'alert-error'}`}>
                            <span>{mensajeAlerta}</span>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        className="btn btn-primary btn-circle w-14 h-14 shadow-2xl  transition-all duration-300 group"
                        onClick={() => {
                            limpiarFormulario();
                            setModalFormulario(true);
                        }}
                        title="Crear nueva reserva"
                    >
                        <svg
                            className="w-8 h-8 transition-transform duration-300"
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

            {/* Modal de Edición de Fecha/Hora */}
            {modalEdit && (
                <dialog id="modal_edit" className="modal modal-open" style={{ zIndex: 99999 }}>
                    <div className="modal-box bg-white" style={{ zIndex: 100000 }}>
                        <h3 className="font-bold text-lg mb-4">Fecha y Hora del Partido</h3>
                        <div className="flex flex-col gap-4 justify-between">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Fecha</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={fechaEdit}
                                    onChange={(e) => setFechaEdit(e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Hora</span>
                                </label>
                                <input
                                    type="time"
                                    className="input input-bordered w-full"
                                    value={horaEdit}
                                    onChange={(e) => setHoraEdit(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-outline" onClick={() => setModalEdit(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={guardarEdicion}>Guardar</button>
                        </div>
                    </div>
                    {/* Backdrop */}
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setModalEdit(false)}>close</button>
                    </form>
                </dialog>
            )}
        </>
    )
}

export default Reservas