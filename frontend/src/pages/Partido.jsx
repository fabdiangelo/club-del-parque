
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavbarBlanco from '../components/NavbarBlanco';
import './Partido.css';

const Partido = () => {
    const { id } = useParams();
    const [partido, setPartido] = useState(null);
    const [cancha, setCancha] = useState(null);

    const [usuarios, setUsuarios] = useState([]);

    const [usuariosParticipantes, setUsuariosParticipantes] = useState([]);
    const [temporada, setTemporada] = useState(null);

    const [modalReserva, setModalReserva] = useState(false);

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

    return (

        <>
            <NavbarBlanco />

            

            {partido && partido?.tipoPartido == 'doubles' ? (
                <div className="container mx-auto py-4" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                    <div style={{paddingTop: '100px', margin: "0 auto", textAlign: 'center'}}>

                {temporada && partido && (

                    <>
                    <h3 style={{fontSize: '48px', textTransform: 'uppercase'}}>Partido, {temporada?.nombre} - {partido?.tipoPartido}</h3>
                      <div style={{textAlign: 'center', marginTop: '20px', width: '500px', height: '5px', backgroundColor: 'var(--primario)', margin: '0 auto', borderRadius: '5px'}}></div>
                    </>

                    
                )}

                
              
            </div>
                    

                    <div>
                        
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>

                            <div>
                                <div style={{ width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden' }}>
                                </div>
                                <div style={{ width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden' }}>
                                </div>


                            </div>

                            <p>vs</p>

                            <div style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>

                                <div>
                                    <div style={{ width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden'}}>
                                    </div>
                                    <div style={{ width: '300px', height: '300px', borderRadius: '50%', overflow: 'hidden' }}>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>

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

                    <div className="action-buttons">
                        
                        <button className="action-btn btn-success" onClick={() => alert('Comenzar partido')}>
                            Reservar fecha y hora
                        </button>
                       
                    </div>

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

                    <p className="intro-text">
                        El partido debe ser jugado en los próximos 7 días. Si no se juega en ese plazo, se considerará perdido por incomparecencia.
                    </p>

                   

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




        </>
    )


}


export default Partido;