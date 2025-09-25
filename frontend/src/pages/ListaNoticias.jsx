import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

// Endpoint configurable por .env (VITE_NOTICIAS_API). Fallback: /api/noticias
const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

const BASE_FILTERS = ["Todas", "Club", "Torneos", "Ranking"];

/* --- Utils --- */
function stripMarkdown(md = "") {
  if (!md) return "";
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/[*_~]/g, "");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}
function excerptFromMd(md = "", max = 220) {
  const raw = stripMarkdown(md);
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export default function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(NOTICIAS_ENDPOINT, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isCancelled) setNoticias(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isCancelled) setFetchError(err?.message || "Error desconocido");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const dataFilters = useMemo(() => {
    const set = new Set();
    for (const n of noticias) {
      if (n?.tipo && typeof n.tipo === "string") set.add(n.tipo);
    }
    const dynamic = Array.from(set);
    return ["Todas", ...(dynamic.length ? dynamic : BASE_FILTERS.slice(1))];
  }, [noticias]);

  const [activeFilter, setActiveFilter] = useState("Todas");

  const filteredNoticias = useMemo(() => {
    if (activeFilter === "Todas") return noticias;
    return noticias.filter((n) => n?.tipo === activeFilter);
  }, [noticias, activeFilter]);

  const showEmptyState = !loading && filteredNoticias.length === 0;

  return (
    <div className="min-h-dvh w-full bg-base-200 text-base-content flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Noticias
          </h1>
          <p className="mt-4 max-w-2xl opacity-80">
            Las novedades del club más recientes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {dataFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`btn btn-sm ${
                  activeFilter === f ? "btn-primary" : "btn-ghost"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading && (
            <p className="mt-4 text-sm opacity-70">Cargando noticias…</p>
          )}
          {fetchError && !loading && (
            <p className="mt-4 text-sm text-error">
              No se pudieron cargar las noticias ({fetchError}).
            </p>
          )}
        </div>
      </section>

      {/* Listado */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {showEmptyState ? (
            <div className="w-full py-16 grid place-items-center">
              <p className="text-2xl font-extrabold">No hay noticias</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNoticias.map((n) => {
                const fecha = n?.fechaCreacion
                  ? new Date(n.fechaCreacion).toLocaleDateString()
                  : "—";
                const excerpt = excerptFromMd(n?.mdContent || "", 200);
                return (
                  <div
                    key={n.id}
                    className="card bg-base-100 border border-base-200 shadow-sm"
                  >
                    {n?.imagenUrl ? (
                      <figure className="aspect-[16/9] overflow-hidden">
                        <img
                          src={n.imagenUrl}
                          alt={n?.titulo || "Noticia"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </figure>
                    ) : (
                      <div className="aspect-[16/9] bg-base-300" />
                    )}

                    <div className="card-body">
                      <span className="text-xs uppercase opacity-60">
                        {fecha}
                      </span>
                      <h2 className="card-title">{n?.titulo || "Título"}</h2>
                      <p className="text-sm">{excerpt}</p>
                      <div className="card-actions justify-between items-center">
                        <Link to={`/noticias/${n.id}`} className="btn btn-neutral btn-sm">
                          Leer más
                        </Link>
                        <div className="badge badge-ghost">
                          {n?.tipo || "Noticia"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
