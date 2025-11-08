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
        // Obtener el registro de federado para leer federadoPartidosIDs
        const fres = await fetch(toApi(`/federados/${user.uid}`), { credentials: 'include', cache: 'no-store' });
        let partidoList = [];

        if (fres.ok) {
          const federado = await fres.json();
          const ids = Array.isArray(federado.federadoPartidosIDs) ? federado.federadoPartidosIDs : [];

          // Si hay ids registrados, traerlos en paralelo
          if (ids.length > 0) {
            const fetches = ids.map(pid =>
              fetch(toApi(`/partidos/${pid}`), { credentials: 'include', cache: 'no-store' })
                .then(r => (r.ok ? r.json() : null))
                .then(p => { if (p) p.id = pid; return p; })
                .catch(() => null)
            );
            const results = await Promise.all(fetches);
            partidoList = (results || []).filter(Boolean);
          } else {
            // Fallback: si no hay federadoPartidosIDs, intentar la ruta antigua por jugador
            const res = await fetch(toApi(`/partidos/jugador/${user.uid}`), { credentials: 'include', cache: 'no-store' });
            if (res.ok) partidoList = await res.json();
          }
        } else {
          // Si no encontramos federado, fallback a /partidos/jugador
          const res = await fetch(toApi(`/partidos/jugador/${user.uid}`), { credentials: 'include', cache: 'no-store' });
          if (res.ok) partidoList = await res.json();
        }

        // Filtrar solo los partidos que tengan oponente definido (ambos lados con jugadores)
        const hasOpponent = (p) => {
          if (!p) return false;
          const leftPopulated = (
            (Array.isArray(p.equipoLocal) && p.equipoLocal.length > 0) ||
            (Array.isArray(p.jugador1) && p.jugador1.length > 0) ||
            Boolean(p.jugador1Id)
          );
          const rightPopulated = (
            (Array.isArray(p.equipoVisitante) && p.equipoVisitante.length > 0) ||
            (Array.isArray(p.jugador2) && p.jugador2.length > 0) ||
            Boolean(p.jugador2Id)
          );
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      <NavbarBlanco transparent={false} />
      <main className="mx-auto max-w-5xl px-6 lg:px-8 w-full pt-24 pb-16">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Acuerdo de Resultados
        </h1>

        {loading ? (
          <div className="mt-6 text-gray-600">Cargando partidos…</div>
        ) : err ? (
          <div className="mt-6 text-red-600 font-semibold">{err}</div>
        ) : partidos.length === 0 ? (
          <p className="mt-8 text-2xl font-extrabold text-gray-700">
            No tienes partidos pendientes de resultado
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table-auto w-full border border-gray-200 shadow-sm rounded-xl bg-white">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Etapa</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Contrincante</th>
                  <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partidos.map((p, idx) => {
                  const key = String(p?.id || p?._id || p?.uid || idx);

                  // Fecha: si existe una propuesta aceptada usar su fecha, sino "Por definir"
                  const propuestaAceptada = (p?.disponibilidades?.propuestas || []).find(pr => pr.aceptada || pr.aceptada === true);
                  const fechaStr = propuestaAceptada && propuestaAceptada.fechaHoraInicio
                    ? new Date(propuestaAceptada.fechaHoraInicio).toLocaleString()
                    : 'Por definir';


                  // Determine which side is opponent of current user
                  const leftNames = (Array.isArray(p.jugador2Nombre) ? p.jugador2Nombre : [p.jugador2Nombre]);
                  const rightNames = (Array.isArray(p.jugador1Nombre) ? p.jugador1Nombre : [p.jugador1Nombre]);

                  let opponentNames = [];
                  if (leftNames.includes(user?.nombre)) opponentNames = rightNames;
                  else if (rightNames.includes(user?.nombre)) opponentNames = leftNames;
                  else {
                    // if uid not found, pick right by default
                    opponentNames = rightNames.length ? rightNames : leftNames;
                  }

                  const opponentDisplay = opponentNames.length ? opponentNames.join(' & ') : '—';

                  const tieneFecha = propuestaAceptada && propuestaAceptada.fechaHoraInicio;

                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-gray-900">{fechaStr}</td>
                      <td className="px-4 py-3 text-gray-900">{p?.etapa || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{p?.tipoPartido || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{opponentDisplay}</td>
                      <td className="px-4 py-3">
                        {
                        p.estado == "finalizado" && p.estadoResultado == "confirmado" ? (
                          <Link to={`/partido/${p?.id || p?._id}`} className="btn btn-success btn-sm normal-case">Finalizado</Link>
                        )
                        : tieneFecha ? (
                          <Link to={`/partidos/${p?.id}/acuerdo`} className="btn btn-primary btn-sm normal-case">Proponer / Confirmar</Link>
                        ) : (
                          <Link to={`/partido/${p?.id || p?._id}`} className="btn btn-secondary btn-sm normal-case">Agendar</Link>
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
