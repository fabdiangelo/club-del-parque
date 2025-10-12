
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavbarBlanco from '../components/NavbarBlanco';
import './Partido.css'; // Importar el archivo CSS

const Partido = () => {
    const { id } = useParams();
    const [partido, setPartido] = useState(null);

    const [usuarios, setUsuarios] = useState([]);

    const [usuariosParticipantes, setUsuariosParticipantes] = useState([]);
    const [temporada, setTemporada] = useState(null);

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
                </div>
            )}


            {usuariosParticipantes.length > 0 && partido.jugadores && partido?.tipoPartido === 'singles' && (
<div style={{ display: 'flex', flexDirection: 'row', gap: '15px', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', color: 'black', height: '100vh'}}>

                <div>
                    <p>Prueba1</p>
                </div>

                
                <div>
                    <p>Prueba1</p>
                </div>
            </div>
            )}


            {usuariosParticipantes.length > 0 && partido.jugadores && partido?.tipoPartido === 'doubles' && (
                <div className='container px-4' style={{ display: 'flex', flexDirection: 'row', gap: '15px', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', color: 'black', height: '100vh'}}>

                    <div>
                        <p>Prueba1</p>
                    </div>

                    <div>
                        <p>Prueba1</p>
                    </div>
                </div>
            )}



        </>
    )


}


export default Partido;