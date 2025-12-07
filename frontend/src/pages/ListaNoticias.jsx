import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import RichTextEditor from "../components/RichTextEditor";

// Endpoint configurable por .env (VITE_NOTICIAS_API). Fallback: /api/noticias
const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

const BASE_FILTERS = ["Todas", "Club", "Torneos", "Ranking"];

/* --- Utils --- */
// Limpieza fuerte: quita front-matter YAML, HTML, atributos kramdown, shortcodes, etc.
function cleanMdForPreview(md = "") {
  if (!md) return "";
  let s = String(md);

  // YAML front matter
  s = s.replace(/^---[\s\S]*?---\s*/g, "");

  // Etiquetas HTML
  s = s.replace(/<[^>]+>/g, "");

  // Atributos kramdown {: .class #id }
  s = s.replace(/\{:\s*[^}]*\}/g, "");

  // Shortcodes tipo [tag ...] o [/tag]
  s = s.replace(/\[(\/)?[a-zA-Z0-9_-]+(?:[^\]]*)\]/g, "");

  // Normalización mínima
  s = s.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n");

  return s.trim();
}

function firstParagraph(md = "") {
  if (!md) return "";
  const parts = cleanMdForPreview(md).split(/\n{2,}/);
  const p = parts.find((x) => x.trim().length > 0) || "";
  return p.trim();
}

export default function Noticias() {
  const { user } = useAuth();
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/noticias`,
          { cache: "no-store" }
        );
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
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
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
    <div
      data-theme="light"
      // Más suave: fondo neutro con leve gradiente gris-azulado
      className="min-h-dvh w-full bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 text-slate-800 flex flex-col pt-16 md:pt-20"
    >
      <NavbarBlanco />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        {/* halos más suaves y un poco azules */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-sky-50 via-sky-100 to-slate-100 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-14 lg:py-20 flex flex-col items-center gap-4 text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl sm:text-5xl font-extrabold tracking-tight">   
              Noticias
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600 text-sm md:text-base">
              Las novedades más recientes del club en un solo lugar.
            </p>
          </div>

          {user?.rol == "administrador" && (
            <div className="mt-4 flex justify-center">
              <Link
                to="/crear-noticia"
                className="btn border-none shadow-sm hover:shadow-md transition-shadow duration-150 bg-gradient-to-r from-sky-500 to-cyan-400"
                style={{
                  color: "white",
                }}
              >
                Crear noticia
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Contenido principal */}
      {/* Azul MUCHO más sutil, con gradiente y mezcla con gris */}
      <section className="flex-1 pb-20 bg-gradient-to-b from-sky-50 via-slate-50 to-sky-100/60">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2 md:gap-3">
              {dataFilters.map((f) => {
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`btn btn-sm rounded-full border text-xs md:text-sm px-4 transition-all duration-150 ${
                      isActive
                        ? // pill activa más clarita
                          "text-sky-900 bg-sky-100/90 border-sky-200 shadow-sm"
                        : "bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    style={
                      isActive
                        ? {
                            borderColor: "var(--primario)",
                          }
                        : {}
                    }
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <p className="text-xs md:text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {filteredNoticias.length}
              </span>{" "}
              noticia{filteredNoticias.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Estados de carga / error */}
          {loading && (
            <div className="mt-4 space-y-3 text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent "></div>
          
              <div className="flex flex-col items-center gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-[85vw] max-w-5xl h-40 rounded-xl bg-slate-200/70 border border-slate-200/60 shadow-sm animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {fetchError && !loading && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold mb-1">
                No se pudieron cargar las noticias
              </p>
              <p className="text-xs md:text-sm">
                Detalle: <span className="font-mono">{fetchError}</span>
              </p>
            </div>
          )}

          {/* Listado de noticias */}
          {showEmptyState ? (
            <div className="w-full py-16 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-800">
                  No hay noticias
                </p>
                <p className="mt-2 text-sm text-slate-500 max-w-md">
                  Cuando haya novedades del club, torneos o rankings, las vas a
                  ver acá mismo.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4">
              {filteredNoticias.map((n) => {
                const fecha = n?.fechaCreacion
                  ? new Date(n.fechaCreacion).toLocaleDateString()
                  : "—";

                const firstImg =
                  (Array.isArray(n.imagenes) && n.imagenes[0]?.imageUrl) ||
                  n.imagenUrl ||
                  null;

                let resumenFull = firstParagraph(n?.mdContent || "");
                resumenFull = resumenFull.replace(/[#*_`~>]/g, "").trim();

                const resumen =
                  resumenFull.length === 0
                    ? "Sin descripción"
                    : resumenFull.length > 140
                    ? resumenFull.slice(0, 140) + "…"
                    : resumenFull;

                return (
                  <article
                    key={n.id}
                    className="w-[85vw] max-w-5xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl overflow-hidden transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Imagen lateral */}
                      {firstImg ? (
                        <div
                          className="sm:w-1/3 w-full overflow-hidden"
                          style={{
                            height: "clamp(160px, 40vw, 240px)",
                            minHeight: "160px",
                            maxHeight: "320px",
                          }}
                        >
                          <img
                            src={firstImg}
                            alt={n?.titulo || "Noticia"}
                            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className="sm:w-1/3 w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100"
                          style={{
                            height: "clamp(160px, 40vw, 240px)",
                            minHeight: "160px",
                            maxHeight: "320px",
                          }}
                        />
                      )}

                      {/* Contenido */}
                      <div className="flex-1 flex flex-col justify-between p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] uppercase tracking-wide text-slate-500">
                              {fecha}
                            </span>
                            <h2 className="font-semibold text-base md:text-lg text-slate-900 line-clamp-2">
                              {n?.titulo || "Título"}
                            </h2>
                          </div>

                          {n?.tipo && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-wide text-slate-600">
                              {n.tipo}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs md:text-sm text-slate-600 line-clamp-2 overflow-hidden">
                          <RichTextEditor
                            valueMarkdown={resumen}
                            readOnly
                            hideToolbar
                            transparent
                            autoHeight
                            className="!rounded-none !border-0 !p-0 [&_.ql-editor]:p-0 [&_.ql-editor]:text-xs md:[&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-600"
                          />
                        </div>

                        <div className="mt-3 flex justify-between items-center">
                          <Link
                            to={`/noticias/${n.id}`}
                            className="btn btn-s transition-all duration-150 bg-neutral-100 hover:bg-sky-100/90"
                            style={{
                              color: "black"
                            }}
                          >
                            Leer más
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
