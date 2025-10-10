import { ChevronLeft, ChevronRight, Trophy, Calendar } from 'lucide-react';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function FixtureCampeonato() {
  const { id } = useParams();

  const [campeonato, setCampeonato] = useState(null);
  const [etapa, setEtapa] = useState(null);
  const [etapaActual, setEtapaActual] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campeonato/${id}`, { credentials: 'include'});
        if (res.ok) {
          const data = await res.json();
          setCampeonato(data)
          setEtapa(campeonato?.etapas[etapaActual])
          console.log(d)
        } 
      } catch (e) {
        console.log(e)
      }
    }
    load();
  }, [id]);

  const navegarEtapa = (direccion) => {
    if (direccion === 'prev' && etapaActual > 0) {
      setEtapaActual(etapaActual - 1);
    } else if (direccion === 'next' && etapaActual < campeonato?.etapas.length - 1) {
      setEtapaActual(etapaActual + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <Navbar />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-cyan-500" />
            <h1 className="text-3xl font-bold text-gray-800">{campeonato?.nombre}</h1>
          </div>
          <p className="text-gray-600 mb-3 whitespace-pre-line">{campeonato?.descripcion}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date(campeonato?.inicio).toLocaleDateString()} - {new Date(campeonato?.fin).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Navegación de etapas */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => navegarEtapa('prev')}
          disabled={etapaActual === 0}
          className="p-2 rounded-lg bg-white shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="bg-gray-800 text-white px-8 py-3 rounded-full shadow-lg">
          <h2 className="text-xl font-semibold text-center uppercase tracking-wide">
            {etapa?.nombre}
          </h2>
        </div>

        <button
          onClick={() => navegarEtapa('next')}
          disabled={etapaActual === campeonato?.etapas.length - 1}
          className="p-2 rounded-lg bg-white shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Contenido de la etapa */}
      <div className="max-w-7xl mx-auto">
        {etapa?.tipoEtapa === 'roundRobin' ? (
          <FaseGrupos grupos={etapa?.grupos} />
        ) : (
          <FaseEliminacion rondas={etapa?.rondas} />
        )}
      </div>
    </div>
  );
};

const FaseGrupos = ({ grupos }) => {
  return (
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
            {grupo.jugadores.map((jugador, jIdx) => (
              <div
                key={jIdx}
                className="flex items-center bg-gray-700 rounded-lg px-3 py-3 mb-2 hover:bg-gray-600 transition-colors"
              >
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {jugador.nombre.charAt(0)}
                </div>
                <span className="flex-1 font-medium">{jugador.nombre}</span>
                <span className="w-12 text-center text-sm">{jugador.gj} | {jugador.gp}</span>
                <span className="w-16 text-center font-bold text-cyan-400">{jugador.puntos}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const FaseEliminacion = ({ rondas }) => {
  const partidoGanado = { jugador1: "Laura Méndez", puntaje1: 7, jugador2: "Tamara Rodriguez", puntaje2: 6 };
  const ganador = partidoGanado?.ganador;

  return (
    <div className="relative bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-tr from-cyan-400 via-cyan-500 to-transparent opacity-80"></div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-gray-700 via-gray-600 to-transparent opacity-90"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="flex justify-between items-start gap-8">
          {rondas?.map((ronda, rIdx) => (
            <div key={rIdx} className="flex-1 min-w-0">
              <h3 className="text-center font-bold text-gray-800 mb-6 text-lg uppercase tracking-wide">
                {ronda.nombre}
              </h3>
              <div className="space-y-4">
                {ronda.partidos.map((partido, pIdx) => (
                  <div key={pIdx} className="space-y-2">
                    <div className="bg-cyan-400 bg-opacity-90 backdrop-blur rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                            {partido.jugador1.charAt(0)}
                          </div>
                          <span className="font-medium text-white truncate">{partido.jugador1}</span>
                        </div>
                        <span className="font-bold text-white text-lg ml-2">{partido.puntaje1}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border-t border-cyan-300 border-opacity-30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                            {partido.jugador2.charAt(0)}
                          </div>
                          <span className="font-medium text-white truncate">{partido.jugador2}</span>
                        </div>
                        <span className="font-bold text-white text-lg ml-2">{partido.puntaje2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Ganador */}
          {ganador && (
            <div className="w-64 flex-shrink-0">
              <h3 className="text-center font-bold text-gray-800 mb-6 text-lg uppercase tracking-wide">
                GANADOR
              </h3>
              <div className="bg-gray-800 rounded-xl shadow-2xl p-6 text-center">
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
    </div>
  );
};