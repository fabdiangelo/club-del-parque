import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Crown,
  CalendarSearch,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import CampeonatoData from "../components/campeonato/CampeonatoData";
import CanchaBg from "../assets/CanchasTenisPadel/1.jpg";
import { useNavigate } from "react-router-dom";
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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campeonato/${id}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        // Calcular fechas de inicio y fin para cada etapa en cadena
        const inicioCampeonato = data.inicio
          ? new Date(data.inicio)
          : new Date();
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
            duracionDias: duracion,
          };
        });

        const campeonatoConFechas = {
          ...data,
          etapas: etapasConFechas,
        };

        setCampeonato(campeonatoConFechas);
        setEtapa(campeonatoConFechas.etapas[etapaActual]);
        console.log(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);
  


  const navegarEtapa = (direccion) => {
    if (direccion === "prev" && etapaActual > 0) {
      setEtapa(campeonato.etapas[etapaActual - 1]);
      setEtapaActual(etapaActual - 1);
    } else if (
      direccion === "next" &&
      etapaActual < campeonato?.etapas.length - 1
    ) {
      setEtapa(campeonato.etapas[etapaActual + 1]);
      setEtapaActual(etapaActual + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>

          <p className="mt-4 text-gray-600">Cargando Campeonato...</p>
        </div>
      </div>
    );
  }

  if (!campeonato && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-6">
        <div className="card w-full max-w-md bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h2 className="card-title">Campeonato no encontrado</h2>
            <p>
              Lo sentimos, pero parece que el campeonato al que intentas acceder
              no existe.
            </p>
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
    );
  }

  return (
    <div
      className="min-h-screen mt-14 relative overflow-hidden"
      style={{
        backgroundImage: `url(${CanchaBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Light + blur layer over the image */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-md" />

      {/* Actual page content on top of the blurred background */}
      <div className="relative p-2 md:p-8">
        <NavbarBlanco />

        <div className="max-w-2xl mx-auto mb-8 mt-10">
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

        <div className="max-w-7xl mx-auto mb-4 flex items-center justify-center gap-3">
          {etapaActual !== 0 ? (
            <button
              title="Etapa Previa"
              onClick={() => navegarEtapa("prev")}
              disabled={etapaActual === 0}
              className="p-2 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-6" />
          )}

          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs md:text-sm font-semibold uppercase tracking-wide text-gray-900 shadow-sm backdrop-blur">
            <span>{etapa?.nombre}</span>
          </div>

          {etapaActual !== campeonato?.etapas.length - 1 ? (
            <button
              title="Etapa Siguiente"
              onClick={() => navegarEtapa("next")}
              disabled={etapaActual === campeonato?.etapas.length - 1}
              className="p-2 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-6" />
          )}
        </div>

        <div className="max-w-7xl mx-auto">
          {etapa?.tipoEtapa === "roundRobin" ? (
            <FaseGrupos
              grupos={etapa?.grupos}
              fechaInicio={etapa?.inicio || campeonato?.inicio}
              duracion={etapa?.duracionDias}
              dobles={campeonato?.dobles}
              etapaId={etapa?.id}
            />
          ) : (
<FaseEliminacion
  rondas={etapa?.rondas}
  fechaInicio={etapa?.inicio || campeonato?.inicio}
  duracion={etapa?.duracionDias}
  dobles={campeonato?.dobles}
  etapaId={etapa?.id}
  gruposDobles={
    campeonato?.etapas?.find((e) => e.tipoEtapa === "roundRobin")?.grupos || []
  }
/>

          )}
        </div>
      </div>
    </div>
  );
}

const FaseGrupos = ({ grupos, fechaInicio, duracion, dobles, etapaId }) => {
  const fechaFinEtapa = new Date(fechaInicio);
  fechaFinEtapa.setDate(fechaFinEtapa.getDate() + duracion);
  const { user } = useAuth();
  const navigate = useNavigate();

  const userGrupo = grupos?.find((grupo) =>
    grupo.jugadores?.some(
      (jugador) =>
        (jugador?.id && jugador.id === user?.uid) ||
        (Array.isArray(jugador?.players) &&
          jugador.players.some((p) => p.id === user?.uid))
    )
  );

  return (
    <>
      <h3
        style={{ zIndex: 30, position: "sticky", top: "3rem" }}
        className="flex justify-center mb-4"
      >
        <div className="inline-flex flex-col items-center px-4 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur text-center">
          <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wide text-gray-800">
            {new Date(fechaInicio).toLocaleDateString()} -{" "}
            {fechaFinEtapa.toLocaleDateString()}
          </span>
        </div>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {grupos?.map((grupo, idx) => (
          <div
            key={idx}
            className="bg-white/90 text-gray-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 backdrop-blur-sm"
          >
            <div className="bg-white px-6 py-4">
              <h3
                className="text-xl font-bold"
                style={{ color: "var(--primario)" }}
              >
                {grupo.nombre}
              </h3>
            </div>

            <div className="p-6">
              <div className="flex text-sm font-semibold mb-3 px-3 text-cyan-700">
                <span className="flex-1">Jugador</span>
                <span className="w-20 text-center">G | P</span>
                <span className="w-16 text-center">Puntos</span>
              </div>

              {grupo.jugadores
                ?.sort((a, b) => b.puntos - a.puntos)
                .map((jugador, jIdx) => (
                  <div key={jIdx}>
                    {jugador ? (
                      Array.isArray(jugador.players) ? (
                        // DOBLES
                        <div
                          className={
                            (jugador.players.every((p) => p?.id) &&
                            jugador.players.some((p) => p.id === user?.uid)
                              ? "bg-cyan-50 hover:bg-cyan-100 "
                              : "bg-slate-50 hover:bg-slate-100 ") +
                            "flex items-center rounded-lg px-3 py-3 mb-2 transition-colors"
                          }
                        >
                          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {(
                              jugador.players[0]?.nombre ||
                              jugador.players[1]?.nombre ||
                              "?"
                            ).charAt(0)}
                          </div>

                          <div className="flex-1">
                            <div className="font-medium text-gray-800 truncate flex items-center">
                              {dobles ? (
                                jugador.players.map((p, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {p?.nombre || "Por definir"}
                                    {idx === 0 && dobles ? " / " : ""}
                                  </span>
                                ))
                              ) : (
                                <span key={jIdx}>
                                  {jugador.players[0]?.nombre || "Por definir"}
                                </span>
                              )}
                              {jugador.players.some(
                                (p) => p.id === user?.uid
                              ) && (
                                <span className="text-cyan-600 ml-2 font-bold">
                                  Tú
                                </span>
                              )}

                              {user &&
                                dobles &&
                                Array.isArray(jugador.players) &&
                                jugador.players.every((pp) => pp?.id) &&
                                !jugador.players.some(
                                  (pp) => pp.id === user?.uid
                                ) &&
                                (() => {
                                  const miEquipoIdx = grupo.jugadores.findIndex(
                                    (eq) =>
                                      Array.isArray(eq.players) &&
                                      eq.players.every((p) => p?.id) &&
                                      eq.players.some((p) => p.id === user?.uid)
                                  );
                                  if (miEquipoIdx === -1) return null;

                                  const partido = (grupo.partidos || []).find(
                                    (p) =>
                                      (p.jugador1Index === miEquipoIdx &&
                                        p.jugador2Index === jIdx) ||
                                      (p.jugador2Index === miEquipoIdx &&
                                        p.jugador1Index === jIdx)
                                  );
                                  if (partido) {
                                    return (
                                      <button
                                        onClick={() => {
                                          navigate(`/partido/${partido.id}`);
                                        }}
                                        className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg"
                                        title="Ir al partido"
                                      >
                                        <CalendarSearch className="w-4 h-4" />
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}
                            </div>
                          </div>

                          <span className="w-20 text-center text-sm text-gray-700">
                            {jugador.ganados ?? jugador.gj ?? 0} |{" "}
                            {jugador.perdidos ?? jugador.gp ?? 0}
                          </span>
                          <span className="w-16 text-center font-bold text-cyan-700">
                            {jugador.puntos || ""}
                          </span>
                        </div>
                      ) : jugador.id ? (
                        // SINGLES
                        <div
                          className={
                            (jugador?.id == user?.uid
                              ? "bg-cyan-50 hover:bg-cyan-100 "
                              : "bg-slate-50 hover:bg-slate-100 ") +
                            "flex items-center rounded-lg px-3 py-3 mb-2 transition-colors"
                          }
                        >
                          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {jugador.nombre ? jugador.nombre.charAt(0) : "?"}
                          </div>
                          <span className="flex-1 font-medium text-gray-800">
                            {jugador.nombre}{" "}
                            {jugador.id == user?.uid && (
                              <span className="text-cyan-600 ml-2 font-bold">
                                Tú
                              </span>
                            )}
                          </span>

                          {user &&
                            jugador.id !== user?.uid &&
                            grupo.jugadores.filter((j) => j.id == user?.uid)
                              .length > 0 &&
                            (() => {
                              const slotIndex = jIdx;
                              const userSlotIndex = (
                                grupo.jugadores || []
                              ).findIndex((s) =>
                                Array.isArray(s.players)
                                  ? s.players.some((p) => p.id === user?.uid)
                                  : s.id === user?.uid
                              );
                              let found = null;
                              if (userSlotIndex !== -1) {
                                found = (grupo.partidos || []).find(
                                  (p) =>
                                    (p.jugador1Index === slotIndex &&
                                      p.jugador2Index === userSlotIndex) ||
                                    (p.jugador2Index === slotIndex &&
                                      p.jugador1Index === userSlotIndex)
                                );
                              }
                              if (!found) {
                                found = (grupo.partidos || []).find(
                                  (p) =>
                                    p.jugador1Index === slotIndex ||
                                    p.jugador2Index === slotIndex ||
                                    p.jugador1Id === jugador.id ||
                                    p.jugador2Id === jugador.id
                                );
                              }
                              if (
                                found &&
                                etapaId &&
                                jugador.id &&
                                grupo.jugadores[userSlotIndex]?.id
                              ) {
                                return (
                                  <button
                                    onClick={() => {
                                      navigate(`/partido/${found.id}`);
                                    }}
                                    className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg"
                                    title="Ir al partido"
                                  >
                                    <CalendarSearch className="w-4 h-4" />
                                  </button>
                                );
                              }
                              return null;
                            })()}

                          <span className="w-20 text-center text-sm text-gray-700">
                            {jugador.ganados ?? jugador.gj ?? 0} |{" "}
                            {jugador.perdidos ?? jugador.gp ?? 0}
                          </span>
                          <span className="w-16 text-center font-bold text-cyan-700">
                            {jugador.puntos}
                          </span>
                        </div>
                      ) : new Date(fechaInicio) > new Date() ? (
                        // POR DEFINIRSE
                        <div className="flex items-center bg-slate-50 rounded-lg px-3 py-3 mb-2 hover:bg-slate-100 transition-colors">
                          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            ?
                          </div>
                          <span className="flex-1 font-medium text-gray-700">
                            <em>Por definirse</em>
                          </span>
                          <span className="w-12 text-center text-sm text-gray-500">
                            {" "}
                            |{" "}
                          </span>
                          <span className="w-16 text-center font-bold text-cyan-700">
                            -
                          </span>
                        </div>
                      ) : (
                        <></>
                      )
                    ) : (
                      <></>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// === Helpers (puedes ponerlos arriba del archivo) ===
const formatFechaProgramada = (fecha) => {
  if (!fecha) return "";

  const d = new Date(fecha);
  if (!isNaN(d.getTime())) {
    const pad = (n) => n.toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} - ${hh}:${mi}`;
  }

  // fallback por si te llega ya en formato "2025-12-08T08:00"
  if (fecha.includes("T")) {
    const [date, time] = fecha.split("T");
    return `${date} - ${time}`;
  }

  return fecha;
};

// Devuelve siempre un array de jugadores para ese lado
const getPlayersSide = (side) => {
  if (!side) return [];
  if (Array.isArray(side)) return side;              // [ {id, nombre}, ... ]
  if (Array.isArray(side.players)) return side.players; // { players: [...] }
  return [side];                                     // singles
};

const getInitialFromSide = (players, fallbackName) => {
  const name =
    players?.[0]?.nombre ||
    players?.[1]?.nombre ||
    fallbackName ||
    "?";
  return name.charAt(0);
};
const buildEquiposPorJugadorId = (grupos = []) => {
  const map = new Map();
  grupos.forEach((grupo) => {
    grupo.jugadores?.forEach((j) => {
      if (Array.isArray(j.players)) {
        j.players.forEach((p) => {
          if (p?.id) {
            // guardamos TODO el equipo para ese id
            map.set(p.id, j.players);
          }
        });
      }
    });
  });
  return map;
};

const resolveTeamPlayers = (side, sideId, equiposMap, dobles) => {
  let players = getPlayersSide(side);
  if (!dobles) return players;

  // si ya vienen dos jugadores, usamos eso
  if (players.length > 1) return players;

  const candidateId = players[0]?.id || sideId;
  if (candidateId && equiposMap.has(candidateId)) {
    return equiposMap.get(candidateId); // [jugador1, jugador2]
  }

  return players;
};
// === COMPONENTE ===
const FaseEliminacion = ({
  rondas = [],
  fechaInicio,
  duracion,
  etapaId,
  dobles,
  gruposDobles = [],
}) => {
  const partidoGanado = rondas[rondas.length - 1]?.partidos?.[0] || null;
  const ganador = partidoGanado?.ganador;
  const { user } = useAuth();
  const navigate = useNavigate();

  const calcularEspaciado = (rondaIdx) => Math.pow(2, rondaIdx) * 120;

  const diasPorRonda =
    rondas.length > 1 ? Math.round(duracion / (rondas.length - 1)) : duracion || 1;

  // mapa jugadorId -> [player1, player2] (misma info que en fase de grupos)
  const equiposPorJugadorId = buildEquiposPorJugadorId(gruposDobles);

  return (
    <div className="relative bg-white rounded-xl shadow-xl overflow-x-auto p-8">
      <div
        className="flex gap-8 items-start justify-center"
        style={{ minWidth: "fit-content", maxHeight: "80vh" }}
      >
        {rondas.map((ronda, rIdx) => {
          const espaciado = calcularEspaciado(rIdx);
          const offsetInicial = espaciado / 2;
          const margenEntrePartidos = 24;

          const fechaFinRonda = new Date(fechaInicio);
          fechaFinRonda.setDate(
            fechaFinRonda.getDate() + diasPorRonda * (rIdx + 1)
          );
          ronda.inicioDate = new Date(
            new Date(fechaInicio).getTime() +
              diasPorRonda * rIdx * 24 * 60 * 60 * 1000
          );
          ronda.inicio = ronda.inicioDate.toLocaleDateString();
          ronda.fin = fechaFinRonda.toLocaleDateString();

          return (
            <div
              key={rIdx}
              className="relative flex flex-col items-center flex-1"
            >
              <h3
                style={{ zIndex: 30, position: "sticky", top: "-2rem" }}
                className="text-center font-semibold text-gray-800 text-sm md:text-base uppercase tracking-wide mb-4"
              >
                <span className="block">{ronda.nombre}</span>
                <span className="block text-xs md:text-sm font-normal text-gray-600">
                  {ronda.inicio} - {ronda.fin}
                </span>
              </h3>

              <div
                className="relative w-full"
                style={{ paddingTop: `${offsetInicial}px` }}
              >
                {ronda.partidos.map((partido, pIdx) => {
                  // AQUÍ: reconstruimos los equipos igual que en fase de grupos
                  const jugadores1 = resolveTeamPlayers(
                    partido.jugador1,
                    partido.jugador1Id,
                    equiposPorJugadorId,
                    dobles
                  );
                  const jugadores2 = resolveTeamPlayers(
                    partido.jugador2,
                    partido.jugador2Id,
                    equiposPorJugadorId,
                    dobles
                  );

                  const esParticipante =
                    user &&
                    (
                      partido.jugador1Id === user?.uid ||
                      partido.jugador2Id === user?.uid ||
                      jugadores1.some((j) => j?.id == user?.uid) ||
                      jugadores2.some((j) => j?.id == user?.uid)
                    );

                  let oponenteId = null;
                  if (esParticipante) {
                    if (partido.jugador1Id === user?.uid)
                      oponenteId = partido.jugador2Id;
                    if (partido.jugador2Id === user?.uid)
                      oponenteId = partido.jugador1Id;

                    if (jugadores1.some((j) => j?.id == user?.uid)) {
                      oponenteId = jugadores2[0]?.id || partido.jugador2Id;
                    }
                    if (jugadores2.some((j) => j?.id == user?.uid)) {
                      oponenteId = jugadores1[0]?.id || partido.jugador1Id;
                    }
                  }

                  return (
                    <div
                      key={pIdx}
                      className="relative"
                      style={{
                        marginTop:
                          pIdx === 0
                            ? "0"
                            : `${
                                espaciado -
                                160 +
                                margenEntrePartidos +
                                rIdx * margenEntrePartidos -
                                rIdx * rIdx * rIdx * 4 +
                                rIdx
                              }px`,
                        marginBottom: `${margenEntrePartidos}px`,
                        position: "relative",
                      }}
                    >
                      {/* Líneas hacia la siguiente ronda */}
                      {rIdx < rondas.length - 1 && (
                        <svg
                          className="absolute left-full pointer-events-none"
                          style={{
                            width: "32px",
                            height: `${espaciado + margenEntrePartidos + 80}px`,
                            top: "40px",
                            overflow: "visible",
                          }}
                        >
                          <line
                            x1="0"
                            y1="15"
                            x2="16"
                            y2="15"
                            stroke="#000"
                            strokeWidth="2"
                          />
                          <line
                            x1="16"
                            y1="15"
                            x2="16"
                            y2={
                              pIdx % 2 === 0
                                ? (espaciado + margenEntrePartidos) / 2 + 15
                                : -(espaciado + margenEntrePartidos) / 2 + 15
                            }
                            stroke="#000"
                            strokeWidth="2"
                          />
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

                      <div
                        className={
                          (esParticipante ? "bg-cyan-300 " : "bg-cyan-400 ") +
                          "bg-opacity-90 backdrop-blur rounded-lg shadow-md hover:shadow-lg transition-shadow relative z-10"
                        }
                      >
                        {/* Equipo 1 */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                              {getInitialFromSide(
                                jugadores1,
                                partido.jugador1Nombre
                              ) || "-"}
                            </div>
                            <span className="font-medium text-black truncate flex gap-2">
                              {jugadores1.length > 0 ? (
                                jugadores1.map((p, i) => (
                                  <span key={i}>
                                    {p?.nombre || "Por definir"}
                                    {i === 0 &&
                                      dobles &&
                                      jugadores1.length > 1 &&
                                      " / "}
                                  </span>
                                ))
                              ) : (
                                partido.jugador1Nombre ||
                                (ronda.inicioDate < new Date()
                                  ? "Pase Libre"
                                  : "Por Definirse")
                              )}

                              {Array.isArray(partido.ganadores) ? (
                                partido.ganadores.some(
                                  (g) =>
                                    g == jugadores1[0]?.id ||
                                    g == partido.jugador1Id
                                ) && <Crown />
                              ) : (
                                partido.ganadorId &&
                                partido.ganadorId == partido.jugador1Id && (
                                  <Crown />
                                )
                              )}
                            </span>
                          </div>

                          {partido.puntaje1 !== undefined ? (
                            <span className="font-bold text-black text-lg ml-2">
                              {partido.puntaje1}
                            </span>
                          ) : partido.fechaProgramada ? (
                            <span
                              className="text-sm text-black ml-2"
                              style={{
                                position: "absolute",
                                marginTop: "3.5rem",
                                right: "1rem",
                              }}
                            >
                              {formatFechaProgramada(partido.fechaProgramada)}
                            </span>
                          ) : (
                            <span
                              className="text-sm text-black ml-2"
                              style={{
                                position: "absolute",
                                marginTop: "3.5rem",
                                right: "1rem",
                              }}
                            >
                              Sin agendar
                            </span>
                          )}

                          {partido.estado === "pendiente" &&
                            esParticipante &&
                            oponenteId ==
                              (jugadores1.length
                                ? jugadores1
                                    .map((p) => p.id)
                                    .find((id) => id !== user?.uid)
                                : partido.jugador1Id) && (
                              <button
                                onClick={() => {
                                  navigate(`/partido/${partido.id}`);
                                }}
                                className="ml-2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg"
                                title="Ir al partido"
                              >
                                <CalendarSearch className="w-4 h-4" />
                              </button>
                            )}
                        </div>

                        {/* Equipo 2 */}
                        <div className="flex items-center justify-between p-3 border-t border-cyan-300 border-opacity-30">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold flex-shrink-0">
                              {getInitialFromSide(
                                jugadores2,
                                partido.jugador2Nombre
                              ) || "-"}
                            </div>
                            <span className="font-medium text-black truncate flex gap-2">
                              {jugadores2.length > 0 ? (
                                jugadores2.map((p, i) => (
                                  <span key={i}>
                                    {p?.nombre || "Por definir"}
                                    {i === 0 &&
                                      dobles &&
                                      jugadores2.length > 1 &&
                                      " / "}
                                  </span>
                                ))
                              ) : (
                                partido.jugador2Nombre ||
                                (ronda.inicioDate < new Date()
                                  ? "Pase Libre"
                                  : "Por Definirse")
                              )}

                              {Array.isArray(partido.ganadores) ? (
                                partido.ganadores.some(
                                  (g) =>
                                    g == jugadores2[0]?.id ||
                                    g == partido.jugador2Id
                                ) && <Crown />
                              ) : (
                                partido.ganadorId &&
                                partido.ganadorId == partido.jugador2Id && (
                                  <Crown />
                                )
                              )}
                            </span>
                          </div>

                          {partido.puntaje2 !== undefined && (
                            <span className="font-bold text-black text-lg ml-2">
                              {partido.puntaje2}
                            </span>
                          )}

                          {partido.estado === "pendiente" &&
                            esParticipante &&
                            oponenteId ==
                              (jugadores2.length
                                ? jugadores2
                                    .map((p) => p.id)
                                    .find((id) => id !== user?.uid)
                                : partido.jugador2Id) && (
                              <button
                                onClick={() => {
                                  if (
                                    etapaId &&
                                    ronda &&
                                    partido &&
                                    partido.id
                                  ) {
                                    navigate(`/partido/${partido.id}`);
                                  }
                                }}
                                className="ml-2 bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-lg"
                                title="Ir al partido"
                              >
                                <CalendarSearch className="w-4 h-4" />
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

        {ganador && (
          <div
            className="flex flex-col items-center flex-shrink-0"
            style={{ width: "280px" }}
          >
            <h3 className="text-center font-bold text-gray-800 mb-8 text-lg uppercase tracking-wide sticky top-0 bg-white z-10 pb-4">
              GANADOR
            </h3>
            <div
              className="bg-gray-800 rounded-xl shadow-2xl p-6 text-center"
              style={{
                marginTop: `${calcularEspaciado(rondas.length - 1) / 2}px`,
              }}
            >
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


