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
      if (!user?.uid) return;
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(toApi(`/partidos/jugador/${user.uid}`), {
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // filtrar partidos sin ganadores
        const pendientes = (data || []).filter(
          (p) => !Array.isArray(p.ganadores) || p.ganadores.length === 0
        );
        setPartidos(pendientes);
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
        <h1 className="text-3xl font-extrabold mb-6">Acuerdo de Resultados</h1>

        {loading ? (
          <div className="text-center text-neutral-600">Cargando partidos…</div>
        ) : err ? (
          <div className="text-red-500">{err}</div>
        ) : partidos.length === 0 ? (
          <div className="card border border-neutral-200 bg-neutral-50 shadow">
            <div className="card-body items-center justify-center min-h-[220px] text-neutral-900">
              <p className="text-lg font-medium">
                No tienes partidos pendientes de resultado 🎉
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full border border-neutral-200 rounded-xl">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Etapa</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {partidos.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2">
                      {p.fecha
                        ? new Date(p.fecha).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">{p.etapa || "—"}</td>
                    <td className="px-4 py-2">{p.tipoPartido || "—"}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/partidos/${p.id}/acuerdo`}
                        className="btn btn-primary btn-sm"
                      >
                        Proponer/Confirmar resultado
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
