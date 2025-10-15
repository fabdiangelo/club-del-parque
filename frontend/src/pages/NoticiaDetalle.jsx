import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { defaultSchema } from "hast-util-sanitize";
import "react-quill-new/dist/quill.bubble.css";
import RichTextEditor from "../components/RichTextEditor";
/* API endpoint */
const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

/* Theme */
const PAGE_BG = "#242424";
const CARD_BG = "#2f2f2f";
const ACCENT = "#1f6b82";

/* Utils */
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "div", "blockquote", "li", "table", "th", "td",
    "u"
  ],
  attributes: {
    ...defaultSchema.attributes,
    p: [...(defaultSchema.attributes?.p || []), ["align"]],
    h1: [...(defaultSchema.attributes?.h1 || []), ["align"]],
    h2: [...(defaultSchema.attributes?.h2 || []), ["align"]],
    h3: [...(defaultSchema.attributes?.h3 || []), ["align"]],
    h4: [...(defaultSchema.attributes?.h4 || []), ["align"]],
    h5: [...(defaultSchema.attributes?.h5 || []), ["align"]],
    h6: [...(defaultSchema.attributes?.h6 || []), ["align"]],
    blockquote: [...(defaultSchema.attributes?.blockquote || []), ["align"]],
    li: [...(defaultSchema.attributes?.li || []), ["align"]],
    div: [...(defaultSchema.attributes?.div || []), ["align"]],
    a: [...(defaultSchema.attributes?.a || []), ["href"], ["target"], ["rel"], ["title"]],
    img: [...(defaultSchema.attributes?.img || []), ["src"], ["alt"], ["title"], ["width"], ["height"]],
    table: [...(defaultSchema.attributes?.table || []), ["align"]],
    th: [...(defaultSchema.attributes?.th || []), ["align"]],
    td: [...(defaultSchema.attributes?.td || []), ["align"]],
  },
};

function repairMarkdownLinks(md = "") {
  if (!md) return "";
  md = md.replace(/\r\n?/g, "\n");
  return md.replace(/\[([^\]]+)]\(([^)]+)\)/g, (m, text, destRaw) => {
    const titleMatch = destRaw.match(/\s+"([^"]*)"(\s*)$/);
    if (titleMatch) {
      const urlPart = destRaw.slice(0, titleMatch.index).replace(/\s+/g, "");
      const title = titleMatch[1].replace(/"/g, '\\"');
      return `[${text}](${urlPart} "${title}")`;
    }
    const cleaned = destRaw.replace(/\s+/g, "");
    return `[${text}](${cleaned})`;
  });
}

function useSwipe(onLeft, onRight) {
  const start = useRef({ x: 0, y: 0 });
  const threshold = 40;
  function onStart(x, y) {
    start.current = { x, y };
  }
  function onMoveEnd(x, y) {
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx < 0) onLeft?.();
      else onRight?.();
    }
  }
  return {
    onTouchStart: (e) => {
      const t = e.touches?.[0];
      if (t) onStart(t.clientX, t.clientY);
    },
    onTouchEnd: (e) => {
      const t = e.changedTouches?.[0];
      if (t) onMoveEnd(t.clientX, t.clientY);
    },
    onMouseDown: (e) => onStart(e.clientX, e.clientY),
    onMouseUp: (e) => onMoveEnd(e.clientX, e.clientY),
  };
}

/* Tiny carousel */
function Carousel({ images, title }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  const go = (i) => {
    if (!images?.length) return;
    const next = (i + images.length) % images.length;
    setFade(false);
    requestAnimationFrame(() => {
      setIdx(next);
      setFade(true);
    });
  };
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, images?.length]);

  const swipe = useSwipe(next, prev);

  // Preload neighbors
  useEffect(() => {
    if (!images?.length) return;
    const left = images[(idx - 1 + images.length) % images.length]?.src;
    const right = images[(idx + 1) % images.length]?.src;
    [left, right].forEach((u) => {
      if (!u) return;
      const img = new Image();
      img.src = u;
    });
  }, [idx, images]);

  if (!images?.length) return null;
  const cur = images[idx];

  return (
    <div className="mt-8">
      <div
        className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl select-none"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        {...swipe}
      >
        <img
          key={cur.src}
          src={cur.src}
          alt={title || "Imagen"}
          className="h-full w-full object-cover"
          style={{ opacity: fade ? 1 : 0, transition: "opacity 400ms ease" }}
          loading="eager"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2"
              aria-label="Anterior"
              title="Anterior"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 p-2"
              aria-label="Siguiente"
              title="Siguiente"
            >
              ›
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: i === idx ? "white" : "rgba(255,255,255,0.5)",
                }}
                aria-label={`Ir a imagen ${i + 1}`}
                title={`Imagen ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <button
              key={im.src + i}
              onClick={() => go(i)}
              className={`relative h-16 w-24 flex-none overflow-hidden rounded-xl border ${
                i === idx ? "border-white/80" : "border-white/15"
              }`}
              title={`Imagen ${i + 1}`}
            >
              <img
                src={im.src}
                alt={`${title || "Imagen"} ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Page */
export default function NoticiaDetalle() {
  const { id } = useParams();

  const [noticia, setNoticia] = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFetching(true);
      setFetchError("");
      setReady(false);
      try {
        const r = await fetch(`${NOTICIAS_ENDPOINT}/${id}`, { cache: "no-store" });
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
    if (!noticia) return;
    setReady(true);
  }, [noticia]);

  const images = useMemo(() => {
    const arr = Array.isArray(noticia?.imagenes) ? noticia.imagenes : [];
    const list = arr
      .map((it) =>
        it?.imageUrl ? { src: it.imageUrl, path: it.imagePath || null } : null
      )
      .filter(Boolean);
    if (list.length === 0 && noticia?.imagenUrl) {
      list.push({ src: noticia.imagenUrl, path: noticia.imagenPath || null });
    }
    return list;
  }, [noticia]);

  // Repair old/bad links for rendering
  const mdForView = useMemo(
    () => repairMarkdownLinks(noticia?.mdContent || ""),
    [noticia?.mdContent]
  );

  if (fetching) {
    return (
      <div className="min-h-dvh w-full flex flex-col text-white" style={{ backgroundColor: PAGE_BG }}>
        <NavbarBlanco />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-lg opacity-80">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!noticia) {
    return (
      <div className="min-h-dvh w-full flex flex-col text-white" style={{ backgroundColor: PAGE_BG }}>
        <NavbarBlanco />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl p-8" style={{ backgroundColor: CARD_BG }}>
            <h1 className="text-2xl font-semibold">Noticia no encontrada</h1>
            <p className="mt-2 text-white/70">La noticia que intentas ver no existe o fue movida.</p>
            {fetchError && <p className="mt-2 text-sm text-red-300">Error al cargar: {fetchError}</p>}
            <Link to="/noticias" className="mt-6 inline-block rounded-full px-4 py-2" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              ← Volver a Noticias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex flex-col text-white" style={{ backgroundColor: PAGE_BG }}>
      <NavbarBlanco />

      <section className="relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link to="/noticias" className="mb-6 inline-block rounded-full px-4 py-1.5 text-sm" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            ← Volver a Noticias
          </Link>

          <p className="text-xs uppercase tracking-wider text-white/60">{fmtDate(noticia.fechaCreacion)}</p>
          <h1 className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight">{noticia.titulo || "Título"}</h1>

          <Carousel images={images} title={noticia?.titulo} />

          {/* Content + Sidebar */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px] transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
            <article className="rounded-2xl p-6" style={{ backgroundColor: CARD_BG }}>
              <div
                className="
                  prose dark:prose-invert md:max-w-3xl max-w-none
                  prose-headings:text-white
                  prose-p:text-white/90
                  prose-strong:text-white
                  prose-blockquote:text-white/70
                  prose-li:text-white/90
                  prose-a:text-blue-400 hover:prose-a:text-blue-300
                  prose-img:rounded-xl prose-img:mx-auto
                  prose-code:text-white
                  break-words
                "
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
<RichTextEditor
                 valueMarkdown={mdForView || "*Sin contenido*"}
                 readOnly
                hideToolbar
                 transparent
                 autoHeight
                 className="!rounded-none !overflow-visible"
               />
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG }}>
                <h3 className="text-lg font-semibold">Relacionadas</h3>
                {relacionadas.length === 0 ? (
                  <p className="mt-2 text-white/60">Sin noticias relacionadas.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {relacionadas.map((rel) => {
                      const relFirst = (Array.isArray(rel.imagenes) && rel.imagenes[0]?.imageUrl) || rel.imagenUrl || null;
                      return (
                        <li key={rel.id} className="flex items-center gap-3">
                          <div className="h-10 w-14 rounded overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                            {relFirst ? <img src={relFirst} alt={rel?.titulo || "Noticia"} className="h-full w-full object-cover" loading="lazy" /> : null}
                          </div>
                          <div className="flex-1">
                            <Link to={`/noticias/${rel.id}`} className="text-sm leading-tight hover:underline">
                              {rel.titulo}
                            </Link>
                            <p className="text-xs text-white/60">{fmtDate(rel.fechaCreacion)}</p>
                          </div>
                        </li>
                      );
                    })}
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
          <button className="rounded-full px-6 py-2 font-medium hover:opacity-90 transition" style={{ backgroundColor: "#fff", color: ACCENT }}>
            Compartir
          </button>
        </div>
      </section>
    </div>
  );
}
