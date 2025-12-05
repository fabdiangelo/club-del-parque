import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useParams } from 'react-router-dom';
import NavbarBlanco from '../components/NavbarBlanco';
import '../styles/Partido.css';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
const Partido = () => {
    const navigate = useNavigate()
    const { id } = useParams();
    const [esDobles, setEsDobles] = useState(false);
    const [partido, setPartido] = useState(null);
    const [cancha, setCancha] = useState(null);
    const [horarioSeleccionado, setHorarioSeleccionado] = useState('');

    const { user } = useAuth();

    const [usuarios, setUsuarios] = useState([]);
    
    const [usuariosParticipantes, setUsuariosParticipantes] = useState([]);
    const [temporada, setTemporada] = useState(null);

    // Modal de disponibilidad
    const [modalReserva, setModalReserva] = useState(false);
    const [fechaSeleccionada, setFechaSeleccionada] = useState('');
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [disponibilidadUsuario, setDisponibilidadUsuario] = useState([]);
    const [mostrarAlerta, setMostrarAlerta] = useState(false);
    const [mensajeAlerta, setMensajeAlerta] = useState('');
    const [posicionUser, setPosicionUser] = useState('');
    const [modalPropuestas, setModalPropuestas] = useState(false);
    const [reservas, setReservas] = useState([]);

    const [modalResponder, setModalResponder] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [reserva, setReserva] = useState(null);
    const [propuestaAceptada, setPropuestaAceptada] = useState(null);

    const getUserById = (userId) => {
        return usuarios.find(u => u.id === userId || u.uid === userId || u.email === userId);
    }

    // Normalize an array that can contain either string ids or objects like { id, nombre }
    const normalizeIds = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(x => {
            if (!x) return '';
            if (typeof x === 'string') return x;
            if (typeof x === 'object') return x.id || x.uid || x?.usuarioId || '';
            return String(x);
        }).filter(Boolean);
    }

    const getNombreForId = (id) => {
        if (!id) return '';
        const u = usuarios.find(u => (u?.uid || u?.id || u?.email) === id || u?.id === id);
        return u?.nombre || u?.name || u?.displayName || u?.nombreCompleto || '';
    }

    // Given an element that may be an id string or an object, resolve a display name
    const displayName = (elem) => {
        if (!elem) return '';
        if (typeof elem === 'string') return getNombreForId(elem) || elem;
        if (typeof elem === 'object') {
            const id = elem.id || elem.uid || elem.usuarioId || '';
            return elem.nombre || elem.name || getNombreForId(id) || id;
        }
        return String(elem);
    }

    const fetchAllReservas = async() => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas`, { credentials: 'include', method: 'GET', headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();

            console.log("FETCH ALL RESERVAS", data);
            setReservas(data);
        } catch(error) {
            console.error("Error al obtener las reservas:", error);
        }

    }


    const fetchReserva = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/partido/${id}`, { credentials: 'include' });
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();

            console.log("RESERVA ENCONTRADA", data);
            setReserva(data);
        } catch(error) {
            console.error("Error al obtener la reserva:", error);
        }
    }

    const aceptarPropuesta = async (propuestaId) => {
        if (propuestaAceptada) {
            alert("Ya hay una propuesta aceptada. No se pueden aceptar más.");
            return;
        }

        if (!propuestaId) {
            console.error("Error: propuestaId no proporcionado.");
            return;
        }

    const idPartido = id || partido?.id; // fallback to route param if partido.id missing
    console.log("Aceptar propuesta", propuestaId, "partido.id:", partido?.id, "route id:", id);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${idPartido}/confirmar-horario`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ propuestaId }),
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Propuesta aceptada:", data);

            setPropuestaAceptada(propuestaId);

            crearReserva(propuestaId);
        } catch (error) {
            console.error("Error al aceptar propuesta:", error);
        }
    };

    const crearReserva = async (propuestaId) => {
        const jugador1 = partido.jugador1[0];
        const jugador2 = partido.jugador2[0];

        const propuesta = partido.disponibilidades.propuestas.find(p => p.id === propuestaId);
    const nuevaReserva = {
        canchaId: partido.canchaID,
        fechaHora: propuesta.fechaHoraInicio,
        duracion: '2:00', 
        esCampeonato: true,
        modo: esDobles ? 'dobles' : 'singles',
        tipoPartido: partido.tipoPartido,
        partidoId: partido.id,
        jugadoresIDS: [{id: jugador1.id}, {id: jugador2.id}],
        quienPaga: user?.uid,
        autor: user?.uid,
        estado: 'pendiente'
    };

    console.log("Nueva reserva:", nuevaReserva);


    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(nuevaReserva),
        });

        if (!response.ok) {
            throw new Error(`Error al crear reserva: ${response.statusText}`);
        }

        fetchReserva();
        
        setMensajeExito('¡La reserva fue creada exitosamente!');
        setTimeout(() => setMensajeExito(''), 3500); 
    } catch (error) {
        console.error("Error al crear reserva:", error);
        alert("Error al crear la reserva");
    }


};

useEffect(() => {
    fetchReserva();
}, [])

    const verPropuestas = () => {
        console.log(partido.disponibilidades.propuestas);
    }

    const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {

    
    setLoading(true);
    setError('');
    Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}`, { credentials: 'include' }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas`, { credentials: 'include', method: 'GET', headers: { 'Content-Type': 'application/json' } }),
    ])
    .then(async ([partidoRes, usuariosRes, reservasRes]) => {
        if (!partidoRes.ok || !usuariosRes.ok || !reservasRes.ok) throw new Error('Error al cargar datos');
        setPartido(await partidoRes.json());
        setUsuarios(await usuariosRes.json());
        setReservas(await reservasRes.json());
        setLoading(false);
    })
    .catch(e => {
        setError('No se pudo cargar el partido. Intenta más tarde.');
        console.error(e);
    })
    .finally(() => setLoading(false));
}, [id]);

    useEffect(() => {
        // Build usuariosParticipantes from multiple possible shapes in partido
        if (usuarios.length > 0 && partido) {
            const participantes = [];

            // 1) If partido.jugadores is an array with items (ids or objects), use it
            const jugadoresIds = normalizeIds(partido.jugadores || []);
            if (jugadoresIds.length >= 2) {
                jugadoresIds.forEach((id, idx) => {
                    const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === id || u?.id === id);
                    if (found) participantes.push(found);
                    else participantes.push({ id, nombre: getNombreForId(id) || `Jugador ${idx + 1}` });
                });
            } else {
                // 2) Try jugador1 / jugador2 arrays (could be for dobles)
                if (Array.isArray(partido.jugador1) && Array.isArray(partido.jugador2) && (partido.jugador1.length || partido.jugador2.length)) {
                    // flatten both arrays
                    const combined = [...partido.jugador1, ...partido.jugador2];
                    combined.forEach((j, idx) => {
                        if (typeof j === 'string') {
                            const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === j || u?.id === j);
                            if (found) participantes.push(found);
                            else participantes.push({ id: j, nombre: getNombreForId(j) || `Jugador ${idx + 1}` });
                        } else if (typeof j === 'object') {
                            const id = j.id || j.uid || j.usuarioId || '';
                            const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === id || u?.id === id);
                            if (found) participantes.push(found);
                            else participantes.push({ id, nombre: j.nombre || j.name || getNombreForId(id) || `Jugador ${idx + 1}` });
                        }
                    });
                } else if (partido.jugador1Id || partido.jugador2Id) {
                    // 3) Individual id fields present
                    const id1 = partido.jugador1Id || partido.jugador1?.[0] || '';
                    const id2 = partido.jugador2Id || partido.jugador2?.[0] || '';
                    if (id1) {
                        const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === id1 || u?.id === id1);
                        if (found) participantes.push(found);
                        else participantes.push({ id: id1, nombre: partido.jugador1Nombre || getNombreForId(id1) || 'Jugador 1' });
                    }
                    if (id2) {
                        const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === id2 || u?.id === id2);
                        if (found) participantes.push(found);
                        else participantes.push({ id: id2, nombre: partido.jugador2Nombre || getNombreForId(id2) || 'Jugador 2' });
                    }
                } else if (Array.isArray(partido.equipoLocal) || Array.isArray(partido.equipoVisitante)) {
                    // 4) Equipo arrays (could be objects or ids)
                    const local = partido.equipoLocal || [];
                    const visit = partido.equipoVisitante || [];
                    const localIds = normalizeIds(local);
                    const visitIds = normalizeIds(visit);
                    [...localIds, ...visitIds].forEach((id, idx) => {
                        const found = usuarios.find(u => (u?.uid || u?.id || u?.email) === id || u?.id === id);
                        if (found) participantes.push(found);
                        else participantes.push({ id, nombre: getNombreForId(id) || `Jugador ${idx + 1}` });
                    });
                }
            }

            // Ensure at least two placeholders exist for singles view
            while (participantes.length < 2) {
                participantes.push({ id: '', nombre: participantes.length === 0 ? 'Jugador 1' : 'Jugador 2' });
            }

            setUsuariosParticipantes(participantes);
            console.log("Usuarios participantes (reconstruidos):", participantes);
        }

        // Fetch temporada and cancha if relevant (tolerant)
        if (partido?.temporadaID) {
            const fetchTemporada = async () => {
                console.log("Fetch temporada llamado para temporadaID:", partido?.temporadaID);
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/temporadas/${partido?.temporadaID}`, { credentials: 'include' });
                    if (!response.ok) throw new Error("Error al obtener la temporada");
                    const data = await response.json();
                    console.log("Temporada obtenida:", data);
                    setTemporada(data);
                } catch (error) {
                    console.error(error);
                }
            }
            fetchTemporada();
        }

        if (partido?.canchaID) {
            const fetchCancha = async () => {
                console.log("Fetch cancha llamado para canchaID:", partido?.canchaID);
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/canchas/${partido?.canchaID}`, { credentials: 'include' });
                    if (!response.ok) throw new Error("Error al obtener la cancha");
                    const data = await response.json();
                    console.log("Cancha obtenida:", data);
                    setCancha(data);
                } catch (error) {
                    console.error(error);
                }
            }
            fetchCancha();
        }
    }, [usuarios, partido]);

    useEffect(() => {
        if (!partido || !user) return;

        

        console.log("SOS user", obtenerPosicionUsuario());
    }, [user])

    useEffect(() => {
        // Consider dobles only when both teams have at least two players
        const localLen = Array.isArray(partido?.equipoLocal) ? partido.equipoLocal.length : 0;
        const visitLen = Array.isArray(partido?.equipoVisitante) ? partido.equipoVisitante.length : 0;
        if (localLen >= 2 && visitLen >= 2) {
            setEsDobles(true);
        } else {
            setEsDobles(false);
        }
    }, [partido]);

    // -------- Helpers para disponibilidad --------
    const generarHorariosDisponibles = () => {
        const horarios = [];
        for (let hora = 8; hora <= 22; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const h = String(hora).padStart(2, '0');
                const m = String(minuto).padStart(2, '0');
                horarios.push(`${h}:${m}`);
            }
        }
        return horarios;
    };

    const obtenerProximasSemanas = () => {
    const fechas = [];
    const hoy = new Date();
    const fechaMaxima = partido?.fechaMaxima ? new Date(partido.fechaMaxima) : new Date(hoy.setDate(hoy.getDate() + 14)); // Por defecto, 2 semanas

    let fechaActual = new Date(hoy); // Comienza desde hoy

    while (fechaActual <= fechaMaxima) {
        // Excluir domingos
        if (fechaActual.getDay() !== 0) {
            fechas.push(new Date(fechaActual)); // Agregar la fecha si no es domingo
        }

        // Incrementar un día
        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
};

   const seleccionarFecha = (fecha) => {
    const fechaLocal = new Date(fecha);
    const year = fechaLocal.getFullYear();
    const month = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLocal.getDate()).padStart(2, '0');

    const fechaStr = `${year}-${month}-${day}`;

    setFechaSeleccionada(fechaStr);

    console.log("Fecha seleccionada:", fechaStr);
    setHorariosDisponibles(generarHorariosDisponibles());
    setHorarioSeleccionado('');
};

    const agregarDisponibilidad = () => {
    if (!fechaSeleccionada || !horaInicio || !horaFin) {
        setMensajeAlerta('Selecciona una fecha y rango de horas');
        setMostrarAlerta(true);
        setTimeout(() => setMostrarAlerta(false), 2500);
        return;
    }

    if (horaFin <= horaInicio) {
        setMensajeAlerta('La hora de fin debe ser mayor que la de inicio');
        setMostrarAlerta(true);
        setTimeout(() => setMostrarAlerta(false), 2500);
        return;
    }

    const duplicado = disponibilidadUsuario.find(
        d => d.fecha === fechaSeleccionada && d.horaInicio === horaInicio && d.horaFin === horaFin
    );

    if (duplicado) {
        setMensajeAlerta('Esta disponibilidad ya fue agregada');
        setMostrarAlerta(true);
        setTimeout(() => setMostrarAlerta(false), 2500);
        return;
    }

    console.log("Verificando conflictos con reservas existentes...");
    console.log("Nueva disponibilidad:", { fechaSeleccionada, horaInicio, horaFin });
    console.log("Reservas existentes:", reservas);

    // Convertir horaInicio y horaFin a objetos Date para la nueva disponibilidad
    const fechaHoraInicioNueva = new Date(`${fechaSeleccionada}T${horaInicio}`);
    const fechaHoraFinNueva = new Date(`${fechaSeleccionada}T${horaFin}`);

    // Verificar si ya existe una reserva con el mismo horario y día
    const conflictoReserva = reservas.some(reserva => {
        const fechaReserva = reserva.fechaHora.split('T')[0];
        const horaInicioReserva = reserva.fechaHora.split('T')[1];
        const duracionReserva = reserva.duracion.split(':');
        const fechaHoraInicioExistente = new Date(`${fechaReserva}T${horaInicioReserva}`);
        const fechaHoraFinExistente = new Date(
            fechaHoraInicioExistente.getTime() +
            (parseInt(duracionReserva[0]) * 60 + parseInt(duracionReserva[1])) * 60 * 1000
        );

        console.log(`Comparando nueva reserva: ${fechaHoraInicioNueva} - ${fechaHoraFinNueva}`);
        console.log(`Con reserva existente: ${fechaHoraInicioExistente} - ${fechaHoraFinExistente}`);

        const solapamiento = (
            fechaHoraInicioNueva < fechaHoraFinExistente && fechaHoraFinNueva > fechaHoraInicioExistente
        );

        console.log(`Solapamiento detectado: ${solapamiento}`);
        return solapamiento;
    });

    if (conflictoReserva) {
        setMensajeAlerta('Ya existe una reserva en este horario y día');
        setMostrarAlerta(true);
        setTimeout(() => setMostrarAlerta(false), 2500);
        return;
    }

    const item = {
        id: Date.now(),
        fecha: fechaSeleccionada,
        horaInicio,
        horaFin,
        rango: `${horaInicio} - ${horaFin}`,
        fechaHoraInicio: `${fechaSeleccionada}T${horaInicio}`,
        fechaHoraFin: `${fechaSeleccionada}T${horaFin}`
    };

    console.log("Disponibilidad agregada:", item);
    setDisponibilidadUsuario(prev => [...prev, item]);
    setHoraInicio('');
    setHoraFin('');
};
    const comprobarSiUserEsJugador = () => {
        if (!partido || !user) return false;
        const userId = user?.uid || user?.id || '';
        const jugadorIds = normalizeIds(partido.jugadores);
        if (jugadorIds.includes(userId)) return true;
        // check jugador1Id / jugador2Id
        if (partido.jugador1Id && partido.jugador1Id === userId) return true;
        if (partido.jugador2Id && partido.jugador2Id === userId) return true;
        // check jugador arrays
        if (Array.isArray(partido.jugador1) && partido.jugador1.some(j => (typeof j === 'string' ? j === userId : (j?.id === userId || j?.uid === userId)))) return true;
        if (Array.isArray(partido.jugador2) && partido.jugador2.some(j => (typeof j === 'string' ? j === userId : (j?.id === userId || j?.uid === userId)))) return true;
        return false;
    }

    const getUserId = (u) => u?.uid || u?.id || u?.email || '';

    const obtenerPosicionUsuario = () => {
        if (!partido || !user) return '';
        const userId = user?.uid || user?.id || '';
        const localIds = normalizeIds(partido.equipoLocal);
        const visitIds = normalizeIds(partido.equipoVisitante);
        if (localIds.length > 0 && localIds.includes(userId)) return 'local';
        if (visitIds.length > 0 && visitIds.includes(userId)) return 'visitante';

        // fallback: infer from partido.jugadores order
        const jugadoresIds = normalizeIds(partido.jugadores || []);
        if (jugadoresIds.length >= 2) {
            if (jugadoresIds[0] === userId) return 'local';
            if (jugadoresIds[1] === userId) return 'visitante';
        }

        // other shapes: jugador1Id / jugador2Id
        if (partido.jugador1Id || (Array.isArray(partido.jugador1) && partido.jugador1.length)) {
            const id1 = partido.jugador1Id || (typeof partido.jugador1[0] === 'string' ? partido.jugador1[0] : partido.jugador1[0]?.id);
            if (id1 === userId) return 'local';
        }
        if (partido.jugador2Id || (Array.isArray(partido.jugador2) && partido.jugador2.length)) {
            const id2 = partido.jugador2Id || (typeof partido.jugador2[0] === 'string' ? partido.jugador2[0] : partido.jugador2[0]?.id);
            if (id2 === userId) return 'visitante';
        }
        return '';
    }

    const removerDisponibilidad = (id) => {
        setDisponibilidadUsuario(prev => prev.filter(d => d.id !== id));
    };

    const enviarDisponibilidad = async () => {
        if (disponibilidadUsuario.length === 0) {
            setMensajeAlerta('Agrega al menos una disponibilidad');
            setMostrarAlerta(true);
            setTimeout(() => setMostrarAlerta(false), 2500);
            return;
        }
        try {
            // Usar siempre getUserId(user)
            const usuarioId = getUserId(user);
            const disponibilidadesConUsuario = disponibilidadUsuario.map(d => ({
                ...d,
                usuarioId,
                propuestoPor: usuarioId
            }));
            console.log("disponibilidad usuario", disponibilidadesConUsuario);

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}/disponibilidad`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ disponibilidad: disponibilidadesConUsuario })
            });
            if (!res.ok) throw new Error('Error al enviar disponibilidad');
            setMensajeAlerta('Disponibilidad enviada exitosamente');
            setMostrarAlerta(true);
            setTimeout(() => {
                setMostrarAlerta(false);
                setModalReserva(false);
                setDisponibilidadUsuario([]);
                setFechaSeleccionada('');
                setHoraInicio('');
                setHoraFin('');
                // Refetch partido para actualizar disponibilidades
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/partidos/${id}`, { credentials: 'include' })
                    .then(r => r.json())
                    .then(data => setPartido(data));
            }, 1800);
        } catch (e) {
            console.error(e);
            setMensajeAlerta('Error al enviar disponibilidad');
            setMostrarAlerta(true);
            setTimeout(() => setMostrarAlerta(false), 2500);
        }
    };

    return (

        <>
            <NavbarBlanco />

{mensajeExito && (
  <div
    role="alert"
    className="alert alert-success"
    style={{
      position: 'fixed',
      left: '32px',
      bottom: '32px',
      zIndex: 9999,
      minWidth: '280px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
    }}
  >
    <svg style={{color: 'white'}} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span style={{color: 'white'}}>{mensajeExito}</span>
  </div>
)}
         
            {partido && esDobles ? (
                <div className="container mx-auto py-4 battle-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px', padding: '20px' }}>

                    <div style={{ paddingTop: '60px', margin: "0 auto", textAlign: 'center', width: '100%' }}>

                        {temporada && partido && (
                            <div style={{ paddingBottom: '30px' }}>
                                <h3 style={{ fontSize: 'clamp(24px, 6vw, 48px)', textTransform: 'uppercase' }}>Partido, {temporada?.nombre} - {partido?.tipoPartido}</h3>
                                <div style={{ textAlign: 'center', marginTop: '20px', width: 'clamp(200px, 80%, 500px)', height: '5px', backgroundColor: 'var(--primario)', margin: '0 auto', borderRadius: '5px' }}></div>
                            </div>
                        )}
                    </div>



                    <div style={{ display: 'flex', flexDirection: 'row', gap: 'clamp(20px, 5vw, 50px)', alignItems: 'center', flex: 1, justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                        {/* Equipo 1 - viene de la izquierda */}
                        <div className="player-circle-left">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div
                                    className="player-circle"
                                    style={{
                                        width: 'clamp(150px, 35vw, 300px)',
                                        height: 'clamp(150px, 35vw, 300px)',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '3px solid #0D8ABC',
                                        background: 'linear-gradient(135deg, #0D8ABC, #1e90ff)',
                                        boxShadow: '0 8px 25px rgba(13, 138, 188, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
                                        fontWeight: 'bold',
                                        flexDirection: 'column',
                                        padding: '10px'
                                    }}
                                >
                                    <div>{displayName(partido?.equipoLocal?.[0]) || 'Jugador 1'}</div>
                                    <div>{displayName(partido?.equipoLocal?.[1]) || 'Jugador 2'}</div>
                                </div>
                                <p className="player-info" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', fontWeight: 'bold', color: '#333' }}>
                                    Equipo Azul
                                </p>
                            </div>
                        </div>
                        <div className="vs-text" style={{fontSize: 'clamp(1.5rem, 5vw, 2rem)'}}>VS</div>

                        <div className="player-circle-right">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div
                                    className="player-circle"
                                    style={{
                                        width: 'clamp(150px, 35vw, 300px)',
                                        height: 'clamp(150px, 35vw, 300px)',
                                        borderRadius: '50%',        
                                        overflow: 'hidden',
                                        border: '3px solid #e74c3c',
                                        background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
                                        boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
                                        fontWeight: 'bold',
                                        flexDirection: 'column',
                                        padding: '10px'
                                    }}
                                >
                                    <div>{displayName(partido?.equipoVisitante?.[0]) || 'Jugador 3'}</div>
                                    <div>{displayName(partido?.equipoVisitante?.[1]) || 'Jugador 4'}</div>
                                </div>
                                <p className="player-info" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', fontWeight: 'bold', color: '#333' }}>
                                    Equipo Rojo
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* Panel de estadísticas para dobles */}
                    {usuariosParticipantes.length >= 4 && (
                        <div className="stats-panel">
                            <h3 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.5rem', color: '#333' }}>
                                Estadísticas de los Equipos
                            </h3>
                            <div className="stats-container">
                                {/* Estadísticas Equipo Azul */}
                                <div className="player-stats blue">
                                    <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#0D8ABC' }}>
                                        Equipo Azul
                                    </h4>
                                    <div style={{ marginBottom: '15px' }}>
                                        <strong>{usuariosParticipantes[0]?.nombre}</strong>
                                        <div className="stat-item">
                                            <span className="stat-label">Ranking:</span>
                                            <span className="stat-value">{usuariosParticipantes[0]?.ranking || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <strong>{usuariosParticipantes[1]?.nombre}</strong>
                                        <div className="stat-item">
                                            <span className="stat-label">Ranking:</span>
                                            <span className="stat-value">{usuariosParticipantes[1]?.ranking || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* VS en el centro */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: '#666',
                                    minWidth: '60px'
                                }}>
                                    VS
                                </div>

                                {/* Estadísticas Equipo Rojo */}
                                <div className="player-stats red">
                                    <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#e74c3c' }}>
                                        Equipo Rojo
                                    </h4>
                                    <div style={{ marginBottom: '15px' }}>
                                        <strong>{usuariosParticipantes[2]?.nombre}</strong>
                                        <div className="stat-item">
                                            <span className="stat-label">Ranking:</span>
                                            <span className="stat-value">{usuariosParticipantes[2]?.ranking || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <strong>{usuariosParticipantes[3]?.nombre}</strong>
                                        <div className="stat-item">
                                            <span className="stat-label">Ranking:</span>
                                            <span className="stat-value">{usuariosParticipantes[3]?.ranking || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='text-center' style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#555' }}>Fecha y Hora: {partido.fechaHoraPartido ? <span>{new Date(partido.fechaHoraPartido).toLocaleString()}</span> : <span>No definido</span>}</p>
                        <p style={{ fontSize: '0.8rem', color: '#555' }}>Cancha: {cancha ? <span>{cancha.nombre}</span> : <span>No definido</span>}</p>
                        <p style={{ fontSize: '0.8rem', color: '#555' }}>Estado: {partido.estado}</p>
                    </div>

                </div>
            ) : (

                <div className="container mx-auto py-4 battle-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px', padding: '20px' }}>

                    <div style={{ paddingTop: '60px', margin: "0 auto", textAlign: 'center', width: '100%' }}>

                        {temporada && partido && (

                            <div style={{ paddingBottom: '30px' }}>
                                <h3 style={{ fontSize: 'clamp(24px, 6vw, 48px)', textTransform: 'uppercase' }}>Partido, {temporada?.nombre} - {partido?.tipoPartido}</h3>

                                <div style={{ textAlign: 'center', marginTop: '20px', width: 'clamp(200px, 80%, 500px)', height: '5px', backgroundColor: 'var(--primario)', margin: '0 auto', borderRadius: '5px' }}></div>
                            </div>


                        )}



                    </div>



                    <div style={{ display: 'flex', flexDirection: 'row', gap: 'clamp(20px, 5vw, 50px)', alignItems: 'center', flex: 1, justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                        <div className="player-circle-left">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div
                                    className="player-circle"
                                    style={{
                                        width: 'clamp(150px, 35vw, 300px)',
                                        height: 'clamp(150px, 35vw, 300px)',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '3px solid #0D8ABC',
                                        background: 'linear-gradient(135deg, #0D8ABC, #1e90ff)',
                                        boxShadow: '0 8px 25px rgba(13, 138, 188, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {usuariosParticipantes[0]?.nombre || 'Jugador 1'}
                                </div>
                                <p className="player-info" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', fontWeight: 'bold', color: '#333' }}>
                                    {usuariosParticipantes[0]?.nombre}
                                </p>
                            </div>
                        </div>

                        <div className="vs-text" style={{fontSize: 'clamp(1.5rem, 5vw, 2rem)'}}>VS</div>

                        <div className="player-circle-right">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div
                                    className="player-circle"
                                    style={{
                                        width: 'clamp(150px, 35vw, 300px)',
                                        height: 'clamp(150px, 35vw, 300px)',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '3px solid #e74c3c',
                                        background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
                                        boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {usuariosParticipantes[1]?.nombre || 'Jugador 2'}
                                </div>
                                <p className="player-info" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.3rem)', fontWeight: 'bold', color: '#333' }}>
                                    {usuariosParticipantes[1]?.nombre}
                                </p>
                            </div>
                        </div>
                    </div>



                    {
                        reserva ? ((

                        <div className="reserva-confirmada-panel mt-8 p-6" style={{ width: '90%', maxWidth: '800px', border: '2px solid green', borderRadius: '8px', backgroundColor: '#e6ffe6' }}>
                            <h3 className="text-lg font-semibold">Reserva Confirmada</h3>
                            <p className="mt-4">La reserva para este partido ha sido confirmada.</p>
                            <p className="mt-2">Fecha y Hora: {new Date(reserva.fechaHora).toLocaleString()}</p>
                            <p className="mt-2">Cancha: {cancha ? cancha.nombre : 'No definida'}</p>

                            <h3 className='mt-2'>Respuesta del administrador 
                                
                                <span style={{backgroundColor: reserva.estado == 'confirmada' ? 'green' : reserva.estado == 'rechazada' ? 'red' : 'orange', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px'}}>
{
                                !reserva.deshabilitar && reserva.estado == 'pendiente' ? 'pendiente de aprobación' : reserva.estado == 'confirmada' ? 'confirmada' : 'rechazada'
                            }
                                </span>
                                </h3>

                        </div>
                    )) : (
                            <div>

                                {partido?.disponibilidades?.propuestas?.length > 0 ? (
                        <div className="propuestas-panel mt-8 p-6" style={{ width: '90%', maxWidth: '800px' }}>
                            <h3 className="text-lg font-semibold mb-4 text-center">
                                {(() => {
                                    const uid = user?.uid || user?.id || '';
                                    const propuestasUsuario = (partido.disponibilidades.propuestas || []).filter(
                                        (propuesta) => propuesta.usuarioId === uid
                                    );
                                    // derive equipoLocalIds robustly from available shapes
                                    const deriveEquipoLocalIds = () => {
                                        if (!partido) return [];
                                        if (Array.isArray(partido.equipoLocal) && partido.equipoLocal.length) return normalizeIds(partido.equipoLocal);
                                        if (Array.isArray(partido.jugador1) && partido.jugador1.length) return normalizeIds(partido.jugador1);
                                        if (partido.jugador1Id) return [partido.jugador1Id];
                                        const jugadores = normalizeIds(partido.jugadores || []);
                                        if (jugadores.length >= 2) return jugadores.slice(0, Math.ceil(jugadores.length / 2));
                                        return [];
                                    };
                                    const equipoLocalIds = deriveEquipoLocalIds();
                                    const propuestasEquipo = (partido.disponibilidades.propuestas || []).filter(
                                        (propuesta) => equipoLocalIds.includes(propuesta.usuarioId)
                                    );

                                    if (propuestasUsuario.length > 0) {
                                        return "Has enviado una propuesta.";
                                    } else if (propuestasEquipo.length > 0) {
                                        return "Un miembro de tu equipo ha enviado una propuesta.";
                                    } else {
                                        return "El equipo contrario ha enviado propuestas.";
                                    }
                                })()}
                            </h3>

                            <div style={{display: 'flex', gap: '20px', width: '100%', flexWrap: 'wrap', justifyContent: 'center'}}>
{(partido.disponibilidades.propuestas || []).map((propuesta) => {
                                const deriveEquipoLocalIds = () => {
                                    if (!partido) return [];
                                    if (Array.isArray(partido.equipoLocal) && partido.equipoLocal.length) return normalizeIds(partido.equipoLocal);
                                    if (Array.isArray(partido.jugador1) && partido.jugador1.length) return normalizeIds(partido.jugador1);
                                    if (partido.jugador1Id) return [partido.jugador1Id];
                                    const jugadores = normalizeIds(partido.jugadores || []);
                                    if (jugadores.length >= 2) return jugadores.slice(0, Math.ceil(jugadores.length / 2));
                                    return [];
                                };
                                const equipoLocalIds = deriveEquipoLocalIds();
                                const isProposerLocal = equipoLocalIds.includes(propuesta.usuarioId);
                                const isUserLocal = equipoLocalIds.includes(user?.uid || user?.id || '');
                                const esDelMismoEquipo = isProposerLocal === isUserLocal;
                                const esElMismoUsuario = propuesta.usuarioId === (user?.uid || user?.id || '');

                                return (
                                    <div key={propuesta.id} className="propuesta mt-4 p-4 border rounded shadow">
                                        <div className="mt-2">
                                            <p><strong>Fecha:</strong> {propuesta.fecha}</p>
                                            <p><strong>Horario:</strong> {propuesta.horaInicio} - {propuesta.horaFin}</p>
                                            <p><strong>Duración:</strong> {propuesta.duracion} minutos</p>
                                            <p><strong>Propuesto por:</strong> {getUserById(propuesta.usuarioId)?.nombre || propuesta.usuarioId}</p>
                                        </div>

                                        {/* Botón para aceptar la propuesta */}
                                        {!esDelMismoEquipo && !partido.disponibilidades.propuestas.some(p => p.aceptada || false) && (
                                            <button
                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                onClick={() => aceptarPropuesta(propuesta.id)}
                                            >
                                                Aceptar Propuesta
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            </div>

                            
                        </div>
                    ) : (
                        comprobarSiUserEsJugador() && (
                            obtenerPosicionUsuario() === 'local' || obtenerPosicionUsuario() === 'visitante' ? (
                                <div className='text-center my-5 intro-text'>
                                    <p>Todavía no se ha generado ninguna propuesta.</p>
                                    <button
                                        style={{
                                            cursor: 'pointer',
                                            marginTop: '10px',
                                            padding: '10px 20px',
                                            backgroundColor: 'var(--primario)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                        }}
                                        onClick={() => setModalReserva(true)}
                                    >
                                        Generar Propuesta
                                    </button>
                                </div>
                            ) : (
                                <div className='text-center'>
                                    
                                </div>
                            )
                        ) 
                    )}
                            </div>
                        )
                    }


{
    comprobarSiUserEsJugador() && (
        <div className='text-center my-5 intro-text'>
            <p>O inicia un chat para coordinar fechas</p>
            <button
                style={{
                    cursor: 'pointer',
                    marginTop: '10px',
                    padding: '10px 20px',
                    backgroundColor: 'var(--primario)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                }}
                onClick={() => {
                    // Buscar el id del usuario contrincante
                    let contrincanteId = null;
                    if (usuariosParticipantes && usuariosParticipantes.length > 0) {
                        // Si el usuario actual es el primero, el contrincante es el segundo, y viceversa
                        if (user?.uid === usuariosParticipantes[0]?.id || user?.id === usuariosParticipantes[0]?.id) {
                            contrincanteId = usuariosParticipantes[1]?.id;
                        } else {
                            contrincanteId = usuariosParticipantes[0]?.id;
                        }
                    }
                    console.log("Navegando al chat con el contrincante:", contrincanteId);
                    if (contrincanteId) {
                        navigate(`/chats/${contrincanteId}`);
                    }
                }}
            >
                <MessageSquare />
            </button>
        </div>
    ) 
}
                    



                    {usuariosParticipantes.length >= 2 && (
                        <div className="stats-panel">

                            

                            <h3 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.5rem', color: '#333' }}>
                                Estadísticas de los Jugadores
                            </h3>
                            <div className="stats-container">
                                {/* Estadísticas Jugador 1 */}
                                <div className="player-stats blue">
                                    <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#0D8ABC' }}>
                                        {usuariosParticipantes[0]?.nombre}
                                    </h4>
                                    <div className="stat-item">
                                        <span className="stat-label">Ranking:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.ranking || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Categoría:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.categoria || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Partidos Ganados:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.partidosOficialesGanados || '0'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Partidos Perdidos:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.partidosOficialesPerdidos || '0'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Mejor Posición:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.mejorPosicionTorneo || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Estado:</span>
                                        <span className="stat-value">{usuariosParticipantes[0]?.estado || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* VS en el centro */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: '#666',
                                    minWidth: '60px'
                                }}>
                                    VS
                                </div>

                                {/* Estadísticas Jugador 2 */}
                                <div className="player-stats red">
                                    <h4 style={{ textAlign: 'center', marginBottom: '20px', color: '#e74c3c' }}>
                                        {usuariosParticipantes[1]?.nombre}
                                    </h4>
                                    <div className="stat-item">
                                        <span className="stat-label">Ranking:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.ranking || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Categoría:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.categoria || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Partidos Ganados:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.partidosOficialesGanados || '0'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Partidos Perdidos:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.partidosOficialesPerdidos || '0'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Mejor Posición:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.mejorPosicionTorneo || 'N/A'}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Estado:</span>
                                        <span className="stat-value">{usuariosParticipantes[1]?.estado || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}




            

            {/* Modal de disponibilidad */}
            {modalReserva && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-1200 p-4">
                    <div className="bg-white rounded-md shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Seleccionar disponibilidad</h3>
                            <button className="btn btn-sm" onClick={() => setModalReserva(false)}>✕</button>
                        </div>
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Calendario simple */}
                            <div className="md:col-span-2">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2">
                                    {obtenerProximasSemanas().map((f) => {
                                        const year = f.getFullYear();
                                        const month = String(f.getMonth() + 1).padStart(2, '0');
                                        const day = String(f.getDate()).padStart(2, '0');
                                        const fechaStr = `${year}-${month}-${day}`;

                                        const esHoy = fechaStr === fechaSeleccionada;
                                        const label = f.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });

                                        return (
                                            <button
                                                key={fechaStr}
                                                onClick={() => seleccionarFecha(f)}
                                                className={`border rounded px-2 py-3 text-sm hover:bg-blue-50 ${esHoy ? 'bg-blue-600 text-white' : 'bg-white'}`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Selector de rango horario */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1">Rango horario</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <select
                                            style={{backgroundColor: 'white'}}
                                            className="select select-bordered w-full"
                                            value={horaInicio}
                                            onChange={e => setHoraInicio(e.target.value)}
                                            disabled={!fechaSeleccionada}
                                        >
                                            <option value="">{fechaSeleccionada ? 'Hora inicio' : 'Elige una fecha primero'}</option>
                                            {horariosDisponibles.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="self-center hidden sm:inline">a</span>
                                        <select
                                        style={{backgroundColor: 'white'}}
                                            className="select select-bordered w-full"
                                            value={horaFin}
                                            onChange={e => setHoraFin(e.target.value)}
                                            disabled={!fechaSeleccionada}
                                        >
                                            <option value="">{fechaSeleccionada ? 'Hora fin' : 'Elige una fecha primero'}</option>
                                            {horariosDisponibles.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <button className="btn btn-primary w-full sm:w-auto" onClick={agregarDisponibilidad} disabled={!fechaSeleccionada || !horaInicio || !horaFin}>Agregar</button>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de disponibilidades */}
                            <div className="lg:col-span-1">
                                <h4 className="font-medium mb-2">Tus disponibilidades</h4>
                                {disponibilidadUsuario.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aún no agregas rangos.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {disponibilidadUsuario.map(d => (
                                            <li key={d.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                                                <span>{new Date(d.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })} - {d.rango}</span>
                                                <button className="btn btn-xs" onClick={() => removerDisponibilidad(d.id)}>Quitar</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                            {mostrarAlerta && (
                                <div className="alert alert-warning py-2 px-3 text-sm w-full">
                                    {mensajeAlerta}
                                </div>
                            )}
                            <div className="ml-auto flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button className="btn w-full sm:w-auto" onClick={() => setModalReserva(false)}>Cancelar</button>
                                <button className="btn btn-primary w-full sm:w-auto" onClick={enviarDisponibilidad}>Enviar disponibilidad</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};


export default Partido;