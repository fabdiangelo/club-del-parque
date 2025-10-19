import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import CampeonatoData from '../components/campeonato/CampeonatoData';

import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FixtureCampeonato() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [campeonato, setCampeonato] = useState(null);
  const [etapa, setEtapa] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/campeonato/${id}`, { credentials: 'include'});
      if (res.ok) {
        const data = await res.json();
        // Calcular fechas de inicio y fin para cada etapa en cadena
        const inicioCampeonato = data.inicio ? new Date(data.inicio) : new Date();
        let cursor = new Date(inicioCampeonato);
        const etapasConFechas = (data.etapas || []).map((et, idx) => {
          const duracion = Number(et.duracionDias) || 0;
          const inicio = new Date(cursor);
          // La etapa finaliza al final del día de su duración
          const fin = new Date(inicio);
          fin.setDate(fin.getDate() + Math.max(0, duracion - 1));
          // Preparar cursor para la siguiente etapa: día siguiente del fin
          cursor = new Date(fin);
          cursor.setDate(cursor.getDate() + 1);
          return {
            ...et,
            inicio: inicio.toISOString(),
            fin: fin.toISOString(),
            duracionDias: duracion
          };
        });

        const campeonatoConFechas = {
          ...data,
          etapas: etapasConFechas
        };

        setCampeonato(campeonatoConFechas);
        setEtapa(campeonatoConFechas.etapas[etapaActual]);
        console.log(data)
      } 
    } catch (e) {
      console.log(e)
    } finally{
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  const navegarEtapa = (direccion) => {
    if (direccion === 'prev' && etapaActual > 0) {
      setEtapa(campeonato.etapas[etapaActual - 1]);
      setEtapaActual(etapaActual - 1);
    } else if (direccion === 'next' && etapaActual < campeonato?.etapas.length - 1) {
      setEtapa(campeonato.etapas[etapaActual + 1]);
      setEtapaActual(etapaActual + 1);
    }
  };

  if(loading){
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando Campeonato...</p>
        </div>
      </div>
    )
  }

  if(!campeonato && !loading){
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h2 className="card-title">Campeonato no encontrado</h2>
            <p>Lo sentimos, pero parece que el campeonato al que intentas acceder no existe.</p>
            <div className="card-actions justify-center mt-4">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/campeonatos")}
              >
                Volver a la lista de campeonatos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 mt-14">
      <NavbarBlanco />
      <div className="max-w-7xl mx-auto mb-8">
        <CampeonatoData
          id={id}
          nombre={campeonato?.nombre}
          descripcion={campeonato?.descripcion}
          inicio={campeonato?.inicio}
          fin={campeonato?.fin}
          requisitosParticipacion={campeonato?.requisitosParticipacion}
          user={user}
          participantes={campeonato?.federadosCampeonatoIDs}
          dobles={campeonato?.dobles}
          onRefresh={load}
        />
      </div>

      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center gap-4">
        {etapaActual !== 0 ? (
          <button
            onClick={() => navegarEtapa('prev')}
            disabled={etapaActual === 0}
            className="p-2 rounded-lg bg-white shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ): (
          <span className="w-6"></span>
        )}
        
        <div className="bg-gray-800 text-white px-8 py-3 rounded-full shadow-lg">
          <h2 className="text-xl font-semibold text-center uppercase tracking-wide">
            {etapa?.nombre}
          </h2>
        </div>

        {etapaActual !== campeonato?.etapas.length - 1 ? (
          <button
            onClick={() => navegarEtapa('next')}
            disabled={etapaActual === campeonato?.etapas.length - 1}
            className="p-2 rounded-lg bg-white shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        ): (
          <span className="w-6"></span>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        {etapa?.tipoEtapa === 'roundRobin' ? (
          <FaseGrupos grupos={etapa?.grupos} fechaInicio={etapa?.inicio || campeonato?.inicio} duracion={etapa?.duracionDias} dobles={campeonato?.dobles} />
        ) : (
          <FaseEliminacion rondas={etapa?.rondas} fechaInicio={etapa?.inicio || campeonato?.inicio} duracion={etapa?.duracionDias} dobles={campeonato?.dobles} />
        )}
      </div>
    </div>
  );
}

const FaseGrupos = ({ grupos, fechaInicio, duracion }) => {
  const fechaFinEtapa = new Date(fechaInicio);
  fechaFinEtapa.setDate(fechaFinEtapa.getDate() + duracion);
  const { user } = useAuth();
  const navigate = useNavigate();

  const userGrupo = grupos?.find(grupo => 
    grupo.jugadores?.some(jugador => (
      // Support dobles: jugador may be an equipo with players array
      (jugador?.id && jugador.id === user?.uid) ||
      (Array.isArray(jugador?.players) && jugador.players.some(p => p.id === user?.uid)) ||
      jugador?.id === user?.uid
    ))
  );
  
  return (
    <>
      <h3 style={{zIndex:'30', width: '100%', marginTop: '', position:'sticky', top:'3rem'}} className="bg-white text-center font-bold text-gray-800 text-lg uppercase tracking-wide sticky bg-white z-10 pb-8 pt-8">
        Round Robin
        <br />
        <label className='label'>
          {new Date(fechaInicio).toLocaleDateString()} - {fechaFinEtapa.toLocaleDateString()}
        </label>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {grupos?.map((grupo, idx) => (
          <div key={idx} className="bg-gray-800 text-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h3 className="text-xl font-bold">{grupo.nombre}</h3>
            </div>
            <div className="p-6">
              <div className="flex text-sm font-semibold mb-3 px-3 text-cyan-300">
                <span className="flex-1">Jugador</span>
                <span className="w-12 text-center">G | P</span>
                <span className="w-16 text-center">Puntos</span>
              </div>
              {grupo.jugadores?.map((jugador, jIdx) => (
                <div key={jIdx}>
                  {jugador ? (
                    // If dobles, jugador may be an equipo with players array
                    Array.isArray(jugador.players) ? (
                      <div className={(jugador.players.some(p => p.id === user?.uid) ? "hover:bg-gray-500 bg-gray-600 " : "hover:bg-gray-600 bg-gray-700 ") + "flex items-center rounded-lg px-3 py-3 mb-2 transition-colors"}>
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          { (jugador.players[0]?.nombre || jugador.players[1]?.nombre || '?').charAt(0) }
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white truncate">
                            {jugador.players.map((p, idx) => (
                              <span key={idx}>{p?.nombre || 'Por definir'}{idx === 0 ? ' / ' : ''}</span>
                            ))}
                            {jugador.players.some(p => p.id === user?.uid) && (<span className='text-cyan-500 ml-2 font-bold'>Tú</span>)}
                          </div>
                        </div>
                        {user && !jugador.players.some(p => p.id === user?.uid) && grupo.jugadores.some(j => Array.isArray(j.players) && j.players.some(p => p.id === user?.uid)) && (
                          <button
                            onClick={() => {
                              const other = jugador.players.find(p => p.id && p.id !== user.uid);
                              if (other) navigate(`/chats/${other.id}`);
                            }}
                            className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg"
                            title="Chatear con equipo"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <span className="w-12 text-center text-sm">{jugador.gj || ''} | {jugador.gp || ''}</span>
                        <span className="w-16 text-center font-bold text-cyan-400">{jugador.puntos || ''}</span>
                      </div>
                    ) : jugador.id ? (
                      <div
                        className={(jugador?.id == user.uid ? "hover:bg-gray-500 bg-gray-600 ": "hover:bg-gray-600 bg-gray-700 ") + "flex items-center rounded-lg px-3 py-3 mb-2 transition-colors"}
                      >
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {jugador.nombre ? jugador.nombre.charAt(0) : '?'}
                        </div>
                        <span className="flex-1 font-medium">{jugador.nombre} {jugador.id == user.uid && (<span className='text-cyan-500 ml-2 font-bold'>Tú</span>)}</span>
                        {user && jugador.id !== user.uid && grupo.jugadores.filter(j => j.id == user.uid).length > 0 && (
                          <button
                            onClick={() => navigate(`/chats/${jugador.id}`)}
                            className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg"
                            title="Chatear con jugador"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <span className="w-12 text-center text-sm">{jugador.gj} | {jugador.gp}</span>
                        <span className="w-16 text-center font-bold text-cyan-400">{jugador.puntos}</span>
                      </div>
                    ) : new Date(fechaInicio) > new Date() ? (
                      <div
                        className="flex items-center bg-gray-500 rounded-lg px-3 py-3 mb-2 hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">?</div>
                        <span className="flex-1 font-medium"><em>Por definirse</em></span>
                        <span className="w-12 text-center text-sm"> | </span>
                        <span className="w-16 text-center font-bold text-cyan-400">-</span>
                      </div>
                    ) : (<></>)
                  ) : (<></>)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const FaseEliminacion = ({ rondas = [], fechaInicio, duracion }) => {
  const partidoGanado = rondas[rondas.length - 1]?.partidos[0] || null;
  const ganador = partidoGanado?.ganador;
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calcular la altura de cada partido basado en la ronda
  const calcularEspaciado = (rondaIdx) => {
    return Math.pow(2, rondaIdx) * 120; // Espaciado exponencial
  };

  const diasPorRonda = Math.round(duracion / (rondas.length - 1))

  return (
    <div className="relative bg-white rounded-xl shadow-xl overflow-x-auto p-8">
      <div className="flex gap-8 items-start justify-center" style={{ minWidth: 'fit-content', maxHeight: '80vh'}}>
        {rondas.map((ronda, rIdx) => {
          const espaciado = calcularEspaciado(rIdx);
          const offsetInicial = espaciado / 2;
          const margenEntrePartidos = 24; // Margen fijo entre partidos

          const fechaFinRonda = new Date(fechaInicio);
          fechaFinRonda.setDate(fechaFinRonda.getDate() + diasPorRonda * (rIdx + 1));
          ronda.inicioDate = new Date(new Date(fechaInicio).getTime() + diasPorRonda * rIdx * 24 * 60 * 60 * 1000);
          ronda.inicio = ronda.inicioDate.toLocaleDateString();
          ronda.fin = fechaFinRonda.toLocaleDateString();

          return (
            <div key={rIdx} className="relative flex flex-col items-center flex-1">
              <h3 style={{zIndex:'30', width: '100%', marginTop: '-4rem', position:'sticky', top:'-2rem'}} className="bg-white text-center font-bold text-gray-800 text-lg uppercase tracking-wide sticky bg-white z-10 pb-8 pt-8">
                {ronda.nombre}
                <br />
                <label className='label'>
                  {ronda.inicio} - {ronda.fin}
                </label>
              </h3>
              
              <div className="relative w-full" style={{ paddingTop: `${offsetInicial}px` }}>
                {ronda.partidos.map((partido, pIdx) => {
                  const posicionY = pIdx * espaciado;
                  const esParticipante = user && (partido.jugador1Id === user.uid || partido.jugador2Id === user.uid);
                  const oponenteId = partido.jugador1Id === user?.uid ? partido.jugador2Id : partido.jugador1Id;
                  
                  return (
                    <div 
                      key={pIdx} 
                      className="relative"
                      style={{ 
                        marginTop: pIdx === 0 ? '0' : `${espaciado - 160 + margenEntrePartidos + rIdx * margenEntrePartidos - rIdx*rIdx*rIdx * 4 + rIdx }px`,
                        marginBottom: `${margenEntrePartidos}px`,
                        position: 'relative'
                      }}
                    >
                      {/* Líneas conectoras hacia la siguiente ronda */}
                      {rIdx < rondas.length - 1 && (
                        <svg 
                          className="absolute left-full pointer-events-none" 
                          style={{ 
                            width: '32px', 
                            height: `${espaciado + margenEntrePartidos + 80}px`,
                            top: '40px',
                            overflow: 'visible'
                          }}
                        >
                          {/* Línea horizontal desde el partido */}
                          <line 
                            x1="0" 
                            y1="15" 
                            x2="16" 
                            y2="15" 
                            stroke="#000" 
                            strokeWidth="2"
                          />
                          
                          {/* Línea vertical conectando */}
                          <line 
                            x1="16" 
                            y1="15" 
                            x2="16" 
                            y2={pIdx % 2 === 0 ? (espaciado + margenEntrePartidos) / 2 + 15 : -(espaciado + margenEntrePartidos) / 2 + 15} 
                            stroke="#000" 
                            strokeWidth="2"
                          />
                          
                          {/* Línea horizontal hacia el siguiente partido (solo para partidos pares) */}
                          {pIdx % 2 === 0 && (
                            <line 
                              x1="16" 
                              y1={(espaciado + margenEntrePartidos) / 2 + 5} 
                              x2="32" 
                              y2={(espaciado + margenEntrePartidos) / 2 + 5} 
                              stroke="#000" 
                              strokeWidth="2"
                            />
                          )}
                        </svg>
                      )}

                      <div className={(esParticipante ? "bg-cyan-300 ": "bg-cyan-400 ") + "bg-opacity-90 backdrop-blur rounded-lg shadow-md hover:shadow-lg transition-shadow relative z-10"}>
                        {/* Player/Team 1 */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                              {(Array.isArray(partido.jugador1) ? (partido.jugador1[0]?.nombre || partido.jugador1[1]?.nombre) : partido.jugador1Nombre || '?')?.charAt(0) || '-'}
                            </div>
                            <span className="font-medium text-black truncate">
                              {Array.isArray(partido.jugador1) ? (
                                partido.jugador1.map((p, i) => <span key={i}>{p?.nombre || 'Por definir'}{i === 0 ? ' / ' : ''}</span>)
                              ) : (
                                partido.jugador1Nombre || (ronda.inicioDate < new Date() ? 'Pase Libre' : 'Por Definirse')
                              )}
                            </span>
                          </div>
                          {partido.puntaje1 !== undefined ? (
                            <span className="font-bold text-black text-lg ml-2">{partido.puntaje1}</span>
                          ) : partido.fechaProgramada ? (
                            <span className="text-sm text-black ml-2" style={{position: 'absolute', marginTop:'3.5rem', right: '1rem'}}>{partido.fechaProgramada}</span>
                          ) : (
                            <span className="text-sm text-black ml-2" style={{position: 'absolute', marginTop:'3.5rem', right: '1rem'}}>Sin agendar</span>
                          )}

                          {partido.estado === 'pendiente' && esParticipante && oponenteId == (Array.isArray(partido.jugador1) ? partido.jugador1.map(p => p.id).find(id => id !== user.uid) : partido.jugador1Id) && (
                            <button
                              onClick={() => navigate(`/chats/${oponenteId}`)}
                              className="ml-2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg"
                              title="Agendar partido"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Player/Team 2 */}
                        <div className="flex items-center justify-between p-3 border-t border-cyan-300 border-opacity-30">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                              {(Array.isArray(partido.jugador2) ? (partido.jugador2[0]?.nombre || partido.jugador2[1]?.nombre) : partido.jugador2Nombre || '?')?.charAt(0) || '-'}
                            </div>
                            <span className="font-medium text-black truncate">
                              {Array.isArray(partido.jugador2) ? (
                                partido.jugador2.map((p, i) => <span key={i}>{p?.nombre || 'Por definir'}{i === 0 ? ' / ' : ''}</span>)
                              ) : (
                                partido.jugador2Nombre || (ronda.inicioDate < new Date() ? 'Pase Libre' : 'Por Definirse')
                              )}
                            </span>
                          </div>
                          {partido.puntaje2 !== undefined && (
                            <span className="font-bold text-black text-lg ml-2">{partido.puntaje2}</span>
                          )}
                          {partido.estado === 'pendiente' && esParticipante && oponenteId == (Array.isArray(partido.jugador2) ? partido.jugador2.map(p => p.id).find(id => id !== user.uid) : partido.jugador2Id) && (
                            <button
                              onClick={() => navigate(`/chats/${oponenteId}`)}
                              className="ml-2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg"
                              title="Agendar partido"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Ganador */}
        {ganador && (
          <div className="flex flex-col items-center flex-shrink-0" style={{ width: '280px' }}>
            <h3 className="text-center font-bold text-gray-800 mb-8 text-lg uppercase tracking-wide sticky top-0 bg-white z-10 pb-4">
              GANADOR
            </h3>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 text-center" style={{ marginTop: `${calcularEspaciado(rondas.length - 1) / 2}px` }}>
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {ganador.charAt(0)}
              </div>
              <h4 className="text-white font-bold text-xl mb-2">{ganador}</h4>
              <div className="bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg">
                CAMPEÓN
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};