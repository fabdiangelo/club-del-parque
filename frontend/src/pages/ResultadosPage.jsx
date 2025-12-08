import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco";
import { useAuth } from "../contexts/AuthProvider";

const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);

export default function ResultadosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [partidos, setPartidos] = useState([]);

  useEffect(() => {
    const fetchPartidos = async () => {
      if (!user?.uid) {
        setPartidos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr("");

      try {
        let partidoList = [];
        const federadoId = user?.id;

        if (federadoId) {
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/partidos/jugador/${federadoId}`,
            { credentials: "include", cache: "no-store" }
          );
          if (res.ok) {
            partidoList = await res.json();
          }
        } else {
          // Si no existe id de federado, fallback a la ruta por jugador
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/partidos/jugador/${user.uid}`,
            { credentials: "include", cache: "no-store" }
          );
          if (res.ok) partidoList = await res.json();
        }

        // Filtrar solo los partidos que tengan oponente definido (ambos lados con jugadores)
        const hasOpponent = (p) => {
          if (!p) return false;
          const leftPopulated =
            (Array.isArray(p.equipoLocal) && p.equipoLocal.length > 0) ||
            (Array.isArray(p.jugador1) && p.jugador1.length > 0) ||
            Boolean(p.jugador1Id);
          const rightPopulated =
            (Array.isArray(p.equipoVisitante) &&
              p.equipoVisitante.length > 0) ||
            (Array.isArray(p.jugador2) && p.jugador2.length > 0) ||
            Boolean(p.jugador2Id);
          return leftPopulated && rightPopulated;
        };

        const visible = (partidoList || []).filter(hasOpponent);
        setPartidos(visible);
      } catch (e) {
        console.error("Error cargando partidos:", e);
        setErr("No se pudieron cargar tus partidos");
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, [user?.uid]);
  const getNamesFromField = (field) => {
    if (!field) return [];

    // Heurística simple para diferenciar nombres de IDs:
    // - Si tiene espacio → casi seguro es un nombre ("Bruno Benítez")
    // - Si NO tiene espacio:
    //      - si es corto (<= 15 chars) lo tomamos como posible nombre ("Bruno")
    //      - si es largo (> 15) lo tratamos como ID (Firebase UID, etc.) y lo ignoramos
    const isProbablyNameString = (str) => {
      const s = String(str).trim();
      if (!s) return false;
      if (s.includes(" ")) return true;
      if (s.length <= 15) return true;
      return false; // likely UID / código
    };

    if (Array.isArray(field)) {
      return field
        .map((item) => {
          if (!item) return null;

          if (typeof item === "string") {
            return isProbablyNameString(item) ? item.trim() : null;
          }

          if (typeof item === "object") {
            if (item.nombre && isProbablyNameString(item.nombre))
              return item.nombre.trim();
            if (item.name && isProbablyNameString(item.name))
              return item.name.trim();
          }

          return null;
        })
        .filter(Boolean);
    }

    if (typeof field === "string") {
      return isProbablyNameString(field) ? [field.trim()] : [];
    }

    if (typeof field === "object") {
      if (field.nombre && isProbablyNameString(field.nombre))
        return [field.nombre.trim()];
      if (field.name && isProbablyNameString(field.name))
        return [field.name.trim()];
    }

    return [];
  };


  const userIds = [user?.id, user?.uid].filter(Boolean);

  const isUserInPlayers = (players) => {
    if (!Array.isArray(players)) return false;
    return players.some(
      (p) => p && userIds.includes(p.id)
    );
  };

  const getOpponentNames = (p) => {
    // Nombres posibles de cada lado (singles o dobles)
    const side1Names = uniq([
      ...getNamesFromField(p.jugador1Nombre),
      ...getNamesFromField(p.jugador1),
      ...getNamesFromField(p.equipoLocal),
    ]);

    const side2Names = uniq([
      ...getNamesFromField(p.jugador2Nombre),
      ...getNamesFromField(p.jugador2),
      ...getNamesFromField(p.equipoVisitante),
    ]);

    const isUserSide1 =
      userIds.includes(p.jugador1Id) ||
      isUserInPlayers(p.jugador1) ||
      isUserInPlayers(p.equipoLocal);

    const isUserSide2 =
      userIds.includes(p.jugador2Id) ||
      isUserInPlayers(p.jugador2) ||
      isUserInPlayers(p.equipoVisitante);

    let opponentNames = [];

    if (isUserSide1) {
      opponentNames = side2Names;
    } else if (isUserSide2) {
      opponentNames = side1Names;
    } else {
      // Fallback: intenta por nombre exacto
      const userName = user?.nombre?.toLowerCase?.();
      const side1HasUser =
        userName &&
        side1Names.some((n) => n?.toLowerCase() === userName);
      const side2HasUser =
        userName &&
        side2Names.some((n) => n?.toLowerCase() === userName);

      if (side1HasUser) opponentNames = side2Names;
      else if (side2HasUser) opponentNames = side1Names;
      else {
        // Si no encontramos al usuario, tiramos por el lado 2, o lado 1 si no hay
        opponentNames = side2Names.length ? side2Names : side1Names;
      }
    }

    // Deduplicar por si vino repetido de varios campos
    return uniq(opponentNames);
  };

  const uniq = (arr) => {
    const seen = new Set();
    return arr.filter((name) => {
      const key = String(name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // 🔹 FULL-SCREEN SPINNER (igual que Rankings)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-700">
            Cargando partidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      <NavbarBlanco transparent={false} />
      <main className="mx-auto max-w-5xl px-6 lg:px-8 w-full pt-24 pb-16">
        {/* TÍTULO CENTRADO */}
        <h1 className="text-5xl sm:text-5xl font-extrabold tracking-tight text-center">
          Acuerdo de resultados
        </h1>

        {err ? (
          <div className="mt-6 text-red-600 font-semibold text-center">
            {err}
          </div>
        ) : partidos.length === 0 ? (
          <p className="mt-8 text-2xl font-normal text-gray-700 text-center">
            No tienes partidos pendientes de resultado
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table-auto w-full border border-gray-200 shadow-sm rounded-xl bg-white">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  {/* HEADERS CENTRADOS */}
                  <th className="px-4 py-3 text-center font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-center font-semibold">Etapa</th>
                  <th className="px-4 py-3 text-center font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Contrincante
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partidos.map((p, idx) => {
                  const key = String(p?.id || p?._id || p?.uid || idx);

                  // Fecha: si existe una propuesta aceptada usar su fecha, sino "Por definir"
                  const propuestaAceptada =
                    (p?.disponibilidades?.propuestas || []).find(
                      (pr) => pr.aceptada || pr.aceptada === true
                    );
                  const fechaStr =
                    propuestaAceptada && propuestaAceptada.fechaHoraInicio
                      ? new Date(
                          propuestaAceptada.fechaHoraInicio
                        ).toLocaleString()
                      : "Por definir";

                  const opponentNames = getOpponentNames(p);
                  const opponentDisplay = opponentNames.length
                    ? opponentNames.join(" / ")
                    : "—";


                  const tieneFecha =
                    propuestaAceptada && propuestaAceptada.fechaHoraInicio;

                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* CELDAS CENTRADAS */}
                      <td className="px-4 py-3 text-gray-900 text-center">
                        {fechaStr}
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-center">
                        {p?.etapa?.split('(')[0].replace(/-\d{13}-/g, "  |  ").replace(/\d{13}-/g, "")|| "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-center">
                        {p?.tipoPartido || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 text-center">
                        {opponentDisplay}
                      </td>
                      <td className="px-4 py-3 text-center">
                        { p.estado == "finalizado" ? (
                          <Link
                            to={`/partido/${p?.id || p?._id}`}
                            className="btn btn-success btn-sm normal-case"
                          >
                            Finalizado
                          </Link>
                        ) : tieneFecha ? (
                          <Link
                            to={`/partidos/${p?.id}/acuerdo`}
                            title="Ir al partido"
                            className="btn btn-primary btn-sm normal-case"
                          >
                            Proponer / Confirmar
                          </Link>
                        ) : (
                          <Link
                            to={`/partido/${p?.id || p?._id}`}
                            className="btn btn-secondary btn-sm normal-case"
                          >
                            Agendar
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
