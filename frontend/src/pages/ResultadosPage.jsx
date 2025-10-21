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
        const res = await fetch(toApi(`/partidos/jugador/${user.uid}`), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        
        const sinGanadores = (data || []).filter(
          (p) => !Array.isArray(p.ganadores) || p.ganadores.length === 0
        );

        setPartidos(sinGanadores);
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
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content w-full">
      <NavbarBlanco transparent={false} />
      <main className="mx-auto max-w-5xl px-6 lg:px-8 w-full pt-24 pb-16">
        <h1 className="text-3xl font-extrabold text-gray-800">
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
                  <th className="px-4 py-3 text-left font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partidos.map((p, idx) => {
                  const key = String(p?.id || p?._id || p?.uid || idx);
                  const fechaBase = p?.timestamp || p?.fecha || p?.createdAt;
                  const fechaStr = fechaBase
                    ? new Date(fechaBase).toLocaleDateString()
                    : "—";

                  return (
                    <tr
                      key={key}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 text-gray-800">{fechaStr}</td>
                      <td className="px-4 py-3 text-gray-800">
                        {p?.etapa || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {p?.tipoPartido || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/partidos/${p?.id || p?._id}/acuerdo`}
                          className="btn btn-primary btn-sm normal-case"
                        >
                          Proponer / Confirmar
                        </Link>
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