// src/pages/NoticiaDetalle.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

// Colors
const PAGE_BG = "#242424";
const CARD_BG = "#2f2f2f";
const ACCENT = "#1f6b82";

function stripMarkdown(md = "") {
  if (!md) return "";
  let t = md;
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`[^`]*`/g, " ");
  t = t.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/^\s{0,3}#{1,6}\s*/gm, "");
  t = t.replace(/^\s{0,3}>\s?/gm, "");
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  t = t.replace(/[*_~]/g, "");
  t = t.replace(/\s+/g, " ");
  return t.trim();
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function NoticiaDetalle() {
  const { id } = useParams();

  const [noticia, setNoticia] = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [ready, setReady] = useState(false);
  const [imgShown, setImgShown] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFetching(true);
      setFetchError("");
      setReady(false);
      setImgShown(false);
      try {
        const r = await fetch(`${NOTICIAS_ENDPOINT}/${id}`, {
          cache: "no-store",
        });
        if (r.ok) {
          const d = await r.json();
          if (!cancelled) setNoticia(d || null);
        } else {
          const rList = await fetch(NOTICIAS_ENDPOINT, { cache: "no-store" });
          if (!rList.ok) throw new Error(`HTTP ${rList.status}`);
          const list = await rList.json();
          if (!cancelled) {
            const found = Array.isArray(list)
              ? list.find((n) => String(n?.id) === String(id))
              : null;
            setNoticia(found || null);
            const rel = Array.isArray(list)
              ? list.filter((n) => String(n?.id) !== String(id)).slice(0, 3)
              : [];
            setRelacionadas(rel);
          }
        }
      } catch (e) {
        if (!cancelled) setFetchError(e?.message || "Error");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function loadRel() {
      if (!noticia) return;
      try {
        const rList = await fetch(NOTICIAS_ENDPOINT, { cache: "no-store" });
        if (!rList.ok) return;
        const list = await rList.json();
        if (!cancelled && Array.isArray(list)) {
          setRelacionadas(
            list.filter((n) => String(n?.id) !== String(noticia.id)).slice(0, 3)
          );
        }
      } catch (e) {
        setFetchError(e?.message || "Error");
      }
    }
    loadRel();
    return () => {
      cancelled = true;
    };
  }, [noticia]);

  useEffect(() => {
    let cancelled = false;
    async function prepareReveal() {
      if (!noticia) return;
      if (noticia.imagenUrl) {
        try {
          const img = new Image();
          img.src = noticia.imagenUrl;
          if (img.decode) {
            await img.decode();
          } else {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
          }
        } catch (e) {
          setFetchError(e?.message || "Error");
        }
      }
      if (!cancelled) {
        setReady(true);
        setImgShown(true);
      }
    }
    prepareReveal();
    return () => {
      cancelled = true;
    };
  }, [noticia]);

  const bodyText = useMemo(
    () => stripMarkdown(noticia?.mdContent || ""),
    [noticia]
  );

  // --- no skeleton --- just plain "Cargando…" text
  if (fetching) {
    return (
      <div
        className="min-h-dvh w-full flex flex-col text-white"
        style={{ backgroundColor: PAGE_BG }}
      >
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-lg opacity-80">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div
        className="min-h-dvh w-full flex flex-col text-white"
        style={{ backgroundColor: PAGE_BG }}
      >
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl p-8" style={{ backgroundColor: CARD_BG }}>
            <h1 className="text-2xl font-semibold">Noticia no encontrada</h1>
            <p className="mt-2 text-white/70">
              La noticia que intentas ver no existe o fue movida.
            </p>
            {fetchError && (
              <p className="mt-2 text-sm text-red-300">
                Error al cargar: {fetchError}
              </p>
            )}
            <Link
              to="/noticias"
              className="mt-6 inline-block rounded-full px-4 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              ← Volver a Noticias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh w-full flex flex-col text-white"
      style={{ backgroundColor: PAGE_BG }}
    >
      <Navbar />

      <section className="relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link
            to="/noticias"
            className="mb-6 inline-block rounded-full px-4 py-1.5 text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            ← Volver a Noticias
          </Link>

          <p className="text-xs uppercase tracking-wider text-white/60">
            {fmtDate(noticia.fechaCreacion)}
          </p>
          <h1 className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight">
            {noticia.titulo || "Título"}
          </h1>

          {/* Imagen */}
          <div
            className="mt-8 aspect-[16/9] w-full rounded-2xl overflow-hidden relative"
            style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          >
            {noticia?.imagenUrl && (
              <img
                src={noticia.imagenUrl}
                alt={noticia?.titulo || "Noticia"}
                style={{
                  opacity: imgShown ? 1 : 0,
                  transition: "opacity 600ms ease",
                }}
                className="h-full w-full object-cover"
                loading="eager"
              />
            )}
          </div>

          {/* Content + Sidebar */}
          <div
            className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px] transition-opacity duration-700"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <article
              className="rounded-2xl p-6"
              style={{ backgroundColor: CARD_BG }}
            >
              <p className="leading-relaxed whitespace-pre-line text-white/90">
                {bodyText || "Sin contenido."}
              </p>
            </article>

            <aside className="space-y-4">
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: CARD_BG }}
              >
                <h3 className="text-lg font-semibold">Compartir</h3>
                <div className="mt-3 flex gap-2">
                  {["X", "FB", "IG"].map((s) => (
                    <button
                      key={s}
                      className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/15 transition"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: CARD_BG }}
              >
                <h3 className="text-lg font-semibold">Relacionadas</h3>
                {relacionadas.length === 0 ? (
                  <p className="mt-2 text-white/60">
                    Sin noticias relacionadas.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {relacionadas.map((rel) => (
                      <li key={rel.id} className="flex items-center gap-3">
                        <div
                          className="h-10 w-14 rounded overflow-hidden"
                          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                        >
                          {rel?.imagenUrl ? (
                            <img
                              src={rel.imagenUrl}
                              alt={rel?.titulo || "Noticia"}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <Link
                            to={`/noticias/${rel.id}`}
                            className="text-sm leading-tight hover:underline"
                          >
                            {rel.titulo}
                          </Link>
                          <p className="text-xs text-white/60">
                            {fmtDate(rel.fechaCreacion)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-10 mt-8" style={{ backgroundColor: ACCENT }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <p className="text-white/95">¿Te gustó esta noticia?</p>
          <button
            className="rounded-full px-6 py-2 font-medium hover:opacity-90 transition"
            style={{ backgroundColor: "#fff", color: ACCENT }}
          >
            Compartir
          </button>
        </div>
      </section>
    </div>
  );
}
