import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { Link } from "react-router-dom";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
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
  const {user} = useAuth();
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
      <NavbarBlanco />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Noticias
          </h1>
          <p className="mt-4 max-w-2xl opacity-80">
            Las novedades del club más recientes.
          </p>
          {user?.rol == "administrador" && (
            <Link to="/crear-noticia" className="btn btn-primary mt-4">
              Crear Noticias
            </Link>
          )}

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

                // Preferir la primera del array; fallback a imagenUrl legacy
                const firstImg =
                  (Array.isArray(n.imagenes) && n.imagenes[0]?.imageUrl) ||
                  n.imagenUrl ||
                  null;

                return (
                  <div
                    key={n.id}
                    className="card bg-base-100 border border-base-200 shadow-sm"
                  >
                    {firstImg ? (
                      <figure className="aspect-[16/9] overflow-hidden">
                        <img
                          src={firstImg}
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

                      {/* Preview con el mismo viewer (solo primer párrafo), sin toolbar y transparente */}
                      <div className="text-sm mt-1">
                        <RichTextEditor
                          valueMarkdown={firstParagraph(n?.mdContent || "")}
                          readOnly
                          hideToolbar
                          transparent
                          autoHeight
                          className="!rounded-none !overflow-visible"
                        />
                      </div>

                      <div className="card-actions justify-between items-center mt-2">
                        <Link
                          to={`/noticias/${n.id}`}
                          className="btn btn-neutral btn-sm"
                        >
                          Leer más
                        </Link>
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
