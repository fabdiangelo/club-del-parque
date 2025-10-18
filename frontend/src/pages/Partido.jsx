import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavbarBlanco from '../components/NavbarBlanco';
import '../styles/Partido.css';
import { useAuth } from '../contexts/AuthProvider';

const Partido = () => {
    const { id } = useParams();
    const [partido, setPartido] = useState(null);
    const [cancha, setCancha] = useState(null);

    const {user} = useAuth();

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

    const verPropuestas = () => {
        console.log(partido.disponibilidades.propuestas);
    }

    useEffect(() => {
        const fetchPartido = async () => {
            const response = await fetch(`/api/partidos/${id}`, { credentials: 'include' });
            const data = await response.json();
            console.log("Datos del partido obtenidos:", data);
            setPartido(data);
        };

        const fetchUsuarios = async () => {
            const res = await fetch('/api/usuarios');
            const data = await res.json();
            setUsuarios(data);
            console.log("Usuarios obtenidos:", data);
        }


        fetchPartido();
        fetchUsuarios();
    }, [id]);

    useEffect(() => {
        if (usuarios.length > 0 && partido?.jugadores) {
            const usuariosParticipantes = usuarios.filter(u => partido.jugadores.includes(u.id));
            setUsuariosParticipantes(usuariosParticipantes);
            console.log("Usuarios participantes:", usuariosParticipantes);
        }


        if(!partido?.temporadaID) return;
        const fetchTemporada = async() => {

            console.log("Fetch temporada llamado para temporadaID:", partido?.temporadaID); 
            try {
                const response = await fetch(`/api/temporadas/${partido?.temporadaID}`, { credentials: 'include' });

                if(!response.ok) throw new Error("Error al obtener la temporada");

                const data = await response.json();
                console.log("Temporada obtenida:", data);
                setTemporada(data);
            } catch(error) {
                throw error;
            }
        }

        if(!partido?.canchaID) return;
        const fetchCancha = async() => {

            console.log("Fetch cancha llamado para canchaID:", partido?.canchaID);
            try {
                const response = await fetch(`/api/canchas/${partido?.canchaID}`, { credentials: 'include' });

                if(!response.ok) throw new Error("Error al obtener la cancha");

                const data = await response.json();
                console.log("Cancha obtenida:", data);
                setCancha(data);
            } catch(error) {
                throw error;
            }
        }
        fetchCancha();
        fetchTemporada();
    }, [usuarios, partido]);

    useEffect(() => {
        if(!partido || !user) return;

        console.log("SOS user", obtenerPosicionUsuario());
    }, [user])

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
        for (let i = 1; i <= 14; i++) {
            const f = new Date();
            f.setDate(hoy.getDate() + i);
            fechas.push(f);
        }
        return fechas;
    };

    const seleccionarFecha = (fecha) => {
        const fechaStr = fecha.toISOString().split('T')[0];
        setFechaSeleccionada(fechaStr);
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
        const item = {
            id: Date.now(),
            fecha: fechaSeleccionada,
            horaInicio,
            horaFin,
            rango: `${horaInicio} - ${horaFin}`,
            fechaHoraInicio: `${fechaSeleccionada}T${horaInicio}`,
            fechaHoraFin: `${fechaSeleccionada}T${horaFin}`
        };
        setDisponibilidadUsuario(prev => [...prev, item]);
        setHoraInicio('');
        setHoraFin('');
    };

    const comprobarSiUserEsJugador = () => {
        if (!partido || !user || !user.uid) return false;
        return Array.isArray(partido.jugadores) && partido.jugadores.includes(user.uid);
    }

    const getUserId = (u) => u?.uid || u?.id || u?.email || '';

    const obtenerPosicionUsuario = () => {
        if (!partido || !user) return '';
        const userId = getUserId(user);
        if (Array.isArray(partido.equipoLocal) && partido.equipoLocal.includes(userId)) {
            return 'local';
        }
        if (Array.isArray(partido.equipoVisitante) && partido.equipoVisitante.includes(userId)) {
            return 'visitante';
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

            const res = await fetch(`/api/partidos/${id}/disponibilidad`, {
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
                fetch(`/api/partidos/${id}`, { credentials: 'include' })
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

            

            {partido && partido?.tipoPartido == 'doubles' ? (
                <div className="container mx-auto py-4 battle-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px' }}>

                    <div style={{paddingTop: '80px', margin: "0 auto", textAlign: 'center'}}>

                        {temporada && partido && (
                            <div style={{paddingBottom: '50px'}}>
                                <h3 style={{fontSize: '48px', textTransform: 'uppercase'}}>Partido, {temporada?.nombre} - {partido?.tipoPartido}</h3>
                                <div style={{textAlign: 'center', marginTop: '20px', width: '500px', height: '5px', backgroundColor: 'var(--primario)', margin: '0 auto', borderRadius: '5px'}}></div>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div className="action-buttons">
                        <button className="action-btn btn-primary" onClick={() => alert('Ver historial de partidos')}>
                            📊 Historial
                        </button>
                        <button className="action-btn btn-success" onClick={() => alert('Comenzar partido')}>
                            ▶️ Iniciar
                        </button>
                        <button className="action-btn btn-secondary" onClick={() => alert('Editar partido')}>
                            ✏️ Editar
                        </button>
                        <button className="action-btn btn-danger" onClick={() => alert('Cancelar partido')}>
                            ❌ Cancelar
                        </button>
                        <button className="action-btn btn-success" onClick={() => setModalReserva(true)}>
                            📅 Reservar fecha y hora
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '50px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        {/* Equipo 1 - viene de la izquierda */}
                        <div className="player-circle-left">
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
                                <div 
                                    className="player-circle"
                                    style={{ 
                                        width: '300px', 
                                        height: '300px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: '3px solid #0D8ABC',
                                        background: 'linear-gradient(135deg, #0D8ABC, #1e90ff)',
                                        boxShadow: '0 8px 25px rgba(13, 138, 188, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div>{usuariosParticipantes[0]?.nombre || 'Jugador 1'}</div>
                                    <div>{usuariosParticipantes[1]?.nombre || 'Jugador 2'}</div>
                                </div>
                                <p className="player-info" style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#333'}}>
                                    Equipo Azul
                                </p>
                            </div>
                        </div>
                        <div className="vs-text">VS</div>

                        <div className="player-circle-right">
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
                                <div 
                                    className="player-circle"
                                    style={{ 
                                        width: '300px', 
                                        height: '300px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: '3px solid #e74c3c',
                                        background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
                                        boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <div>{usuariosParticipantes[2]?.nombre || 'Jugador 3'}</div>
                                    <div>{usuariosParticipantes[3]?.nombre || 'Jugador 4'}</div>
                                </div>
                                <p className="player-info" style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#333'}}>
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

                    <div className='text-center' style={{marginTop: '20px'}}>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Fecha y Hora: {partido.fechaHoraPartido ? <span>{new Date(partido.fechaHoraPartido).toLocaleString()}</span> : <span>No definido</span>}</p>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Cancha: {cancha ? <span>{cancha.nombre}</span> : <span>No definido</span>}</p>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Estado: {partido.estado}</p>
                    </div>

                </div>
                    ): (

                    <div className="container mx-auto py-4 battle-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px' }}>

                        <div style={{paddingTop: '80px', margin: "0 auto", textAlign: 'center'}}>

                {temporada && partido && (

                    <div style={{paddingBottom: '50px'}}>
                    <h3  style={{fontSize: '48px', textTransform: 'uppercase'}}>Partido, {temporada?.nombre} - {partido?.tipoPartido}</h3>
                   
                      <div style={{textAlign: 'center', marginTop: '20px', width: '500px', height: '5px', backgroundColor: 'var(--primario)', margin: '0 auto', borderRadius: '5px'}}></div>
                    </div>

                    
                )}

                
              
            </div>

                    { comprobarSiUserEsJugador() && partido?.disponibilidades?.length < 1 &&(<div className="action-buttons">
                        
                        <button className="action-btn btn-success" onClick={() => setModalReserva(true)}>
                            Reservar fecha y hora
                        </button>
                       
                    </div>)}

                    {partido?.disponibilidades?.length > 0 && obtenerPosicionUsuario() == 'local' && (

                        <div className='modal modal-open'>
                            <p>Tu equipo ya ha enviado propuestas de disponibilidad, esperando la respuesta del otro equipo.</p>
                            <div>
                                <button onClick={verPropuestas}>Ver Propuestas</button>

                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '50px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        <div className="player-circle-left">
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
                                <div 
                                    className="player-circle"
                                    style={{ 
                                        width: '300px', 
                                        height: '300px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: '3px solid #0D8ABC',
                                        background: 'linear-gradient(135deg, #0D8ABC, #1e90ff)',
                                        boxShadow: '0 8px 25px rgba(13, 138, 188, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {usuariosParticipantes[0]?.nombre || 'Jugador 1'}
                                </div>
                                <p className="player-info" style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#333'}}>
                                    {usuariosParticipantes[0]?.nombre}
                                </p>
                            </div>
                        </div>

                        <div className="vs-text">VS</div>

                        <div className="player-circle-right">
                            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center'}}>
                                <div 
                                    className="player-circle"
                                    style={{ 
                                        width: '300px', 
                                        height: '300px', 
                                        borderRadius: '50%', 
                                        overflow: 'hidden', 
                                        border: '3px solid #e74c3c',
                                        background: 'linear-gradient(135deg, #e74c3c, #ff6b6b)',
                                        boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {usuariosParticipantes[1]?.nombre || 'Jugador 2'}
                                </div>
                                <p className="player-info" style={{fontSize: '1.3rem', fontWeight: 'bold', color: '#333'}}>
                                    {usuariosParticipantes[1]?.nombre}
                                </p>
                            </div>
                        </div>
                    </div>

                   
                    <div>

                        {partido?.disponibilidades.length < 1 ? (
                            <p className="intro-text">
                            El partido debe ser jugado en los próximos 7 días. Si no se juega en ese plazo, se considerará perdido por incomparecencia.
                        </p>
                    ) : (
                        obtenerPosicionUsuario() === 'visitante' ? (
                            <div className=''>
                                <p className="intro-text">El equipo local ha enviado las siguientes propuestas de disponibilidad:</p>
                                <button style={{backgroundColor: 'var(--primario)', padding: '10px 20px', borderRadius: '5px', color: 'white', border: 'none', cursor: 'pointer'}} onClick={verPropuestas}>Ver Propuestas</button>
                            </div>
                        ) : obtenerPosicionUsuario() === 'local' ? (
                            <div className='text-center'>
                                <p className="intro-text">Tu equipo ya ha enviado propuestas de disponibilidad, esperando la respuesta del otro equipo.</p>
                                <button style={{backgroundColor: 'var(--primario)', padding: '10px 20px', borderRadius: '5px', color: 'white', border: 'none', cursor: 'pointer'}}
                               onClick={verPropuestas}>Ver Propuestas</button>
                            </div>
                        ) : (
                            <div className=''>
                                <p className="intro-text">Ya existen propuestas de disponibilidad para este partido.</p>
                            </div>
                        )
                    )}

                   
</div>                

                    {usuariosParticipantes.length >= 2 && (
                        <div className="stats-panel">

 <div className='text-center'>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Fecha y Hora: {partido.fechaHoraPartido ? <span>{new Date(partido.fechaHoraPartido).toLocaleString()}</span> : <span>No definido</span>}</p>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Cancha: {cancha ? <span>{cancha.nombre}</span> : <span>No definido</span>}</p>
                        <p style={{fontSize: '0.8rem', color: '#555'}}>Estado: {partido.estado}</p>

                    </div>
                            
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




            {/* Backdrop overlay */}
            {modalReserva && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
            )}

            {/* Modal de disponibilidad */}
            {modalReserva && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">Seleccionar disponibilidad</h3>
                            <button className="btn btn-sm" onClick={() => setModalReserva(false)}>✕</button>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Calendario simple */}
                            <div className="md:col-span-2">
                                <h4 className="font-medium mb-2">Próximos 14 días</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {obtenerProximasSemanas().map((f) => {
                                        const fechaStr = f.toISOString().split('T')[0];
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
                                    <div className="flex gap-2">
                                        <select
                                            className="select select-bordered w-full max-w-xs"
                                            value={horaInicio}
                                            onChange={e => setHoraInicio(e.target.value)}
                                            disabled={!fechaSeleccionada}
                                        >
                                            <option value="">{fechaSeleccionada ? 'Hora inicio' : 'Elige una fecha primero'}</option>
                                            {horariosDisponibles.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="self-center">a</span>
                                        <select
                                            className="select select-bordered w-full max-w-xs"
                                            value={horaFin}
                                            onChange={e => setHoraFin(e.target.value)}
                                            disabled={!fechaSeleccionada}
                                        >
                                            <option value="">{fechaSeleccionada ? 'Hora fin' : 'Elige una fecha primero'}</option>
                                            {horariosDisponibles.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <button className="btn btn-primary" onClick={agregarDisponibilidad} disabled={!fechaSeleccionada || !horaInicio || !horaFin}>Agregar</button>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de disponibilidades */}
                            <div className="md:col-span-1">
                                <h4 className="font-medium mb-2">Tus disponibilidades</h4>
                                {disponibilidadUsuario.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aún no agregas rangos.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {disponibilidadUsuario.map(d => (
                                            <li key={d.id} className="flex items-center justify-between border rounded px-3 py-2">
                                                <span className="text-sm">{new Date(d.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })} - {d.rango}</span>
                                                <button className="btn btn-xs" onClick={() => removerDisponibilidad(d.id)}>Quitar</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t flex items-center justify-between">
                            {mostrarAlerta && (
                                <div className="alert alert-warning py-2 px-3 text-sm">
                                    {mensajeAlerta}
                                </div>
                            )}
                            <div className="ml-auto flex gap-2">
                                <button className="btn" onClick={() => setModalReserva(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={enviarDisponibilidad}>Enviar disponibilidad</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    )


}


export default Partido;