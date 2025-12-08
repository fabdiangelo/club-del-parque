import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import CampeonatoData from "../components/campeonato/CampeonatoData";

import bgCanchas from "../assets/CanchasTenisPadel/1.webp";

const ITEMS_PER_PAGE = 4;

export default function ListaCampeonatos() {
  const [campeonatos, setCampeonatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();

useEffect(() => {
  async function load() {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campeonatos`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const hoy = new Date();
      // usamos solo la parte de fecha, sin horas
      hoy.setHours(0, 0, 0, 0);

      const toDateOnly = (value) => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
      };

      // 1) Filtrar campeonatos terminados (fin < hoy)
      const activos = (Array.isArray(data) ? data : []).filter((c) => {
        const fin = toDateOnly(c.fin);
        // si no tiene fecha fin válida, lo dejamos
        if (!fin) return true;
        return fin >= hoy;
      });

      // 2) Ordenar por prioridad:
      //    - primero los que están en curso
      //    - luego los futuros, más cercanos primero
      const ordenados = activos.sort((a, b) => {
        const aInicio = toDateOnly(a.inicio);
        const aFin = toDateOnly(a.fin);
        const bInicio = toDateOnly(b.inicio);
        const bFin = toDateOnly(b.fin);

        // si alguna fecha es inválida, las mandamos al final
        if (!aInicio || !aFin) return 1;
        if (!bInicio || !bFin) return -1;

        const aOngoing = aInicio <= hoy && aFin >= hoy;
        const bOngoing = bInicio <= hoy && bFin >= hoy;

        // campeonatos en curso primero
        if (aOngoing && !bOngoing) return -1;
        if (!aOngoing && bOngoing) return 1;

        // si ambos son en curso o ambos futuros/pasados,
        // ordenamos por cercanía de la fecha de inicio a hoy
        const diffA = Math.abs(aInicio.getTime() - hoy.getTime());
        const diffB = Math.abs(bInicio.getTime() - hoy.getTime());

        return diffA - diffB;
      });

      setCampeonatos(ordenados);
    } catch (err) {
      setFetchError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);


  // si cambia el número de campeonatos, volvemos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [campeonatos.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg">Cargando campeonatos...</p>
        </div>
      </div>
    );
  }

  const totalPages =
    campeonatos.length > 0
      ? Math.ceil(campeonatos.length / ITEMS_PER_PAGE)
      : 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const campeonatosPage = campeonatos.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePrevPage = () =>
    setCurrentPage((p) => Math.max(1, p - 1));

  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      {/* Fondo borroso */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgCanchas})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          transform: "scale(1.05)",
        }}
      />
      {/* Capa oscura encima del fondo */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido por encima del fondo */}
      <div className="relative z-10 text-base-content flex flex-col">
        <NavbarBlanco />

        {/* Hero / top area */}
        <section className="relative overflow-hidden">
          <div className="my-5 ml-5 mt-30">
            {user?.rol === "administrador" && (
              <Link
                to="/crear-campeonato"
                className="fixed bottom-6 right-6 bg-[var(--primario)] text-white w-14 h-14 rounded-full flex items-center justify-center text-4xl shadow-xl hover:scale-110 transition-transform"
              >
                +
              </Link>
            )}

            {fetchError && (
              <p className="mt-4 text-sm text-error text-white">
                No se pudieron cargar los campeonatos ({fetchError}).
              </p>
            )}
          </div>
        </section>

        {/* Listado */}
        <section className="pb-20 flex-1">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            {!campeonatos || campeonatos.length === 0 ? (
              <div className="w-full py-16 grid place-items-center">
                <div className="text-center bg-white/90 rounded-2xl shadow-xl px-6 py-8 backdrop-blur-sm">
                  <h2 className="text-2xl font-semibold mb-2">
                    Todavía no hay campeonatos activos
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Vuelve pronto, estamos preparando nuevos torneos.
                  </p>
                  {user?.rol === "administrador" && (
                    <Link
                      to="/crear-campeonato"
                      className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[var(--primario)] text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      Crear el primer campeonato
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* cards flotando directamente sobre el fondo */}
                <div className="space-y-6">
                  {campeonatosPage.map((campeonato) => (
                    <CampeonatoData
                      key={campeonato.id}
                      id={campeonato.id}
                      nombre={campeonato.nombre}
                      descripcion={campeonato.descripcion}
                      inicio={campeonato.inicio}
                      fin={campeonato.fin}
                      requisitosParticipacion={
                        campeonato.requisitosParticipacion
                      }
                      user={user}
                      participantes={campeonato.federadosCampeonatoIDs}
                      conRedireccion={true}
                    />
                  ))}
                </div>

                {/* Controles de paginación */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-full border border-white/60 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                    >
                      Anterior
                    </button>
                    <span className="text-white text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-full border border-white/60 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
