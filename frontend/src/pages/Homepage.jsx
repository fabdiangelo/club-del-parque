// src/pages/Homepage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import logoUrl from "../assets/Logo.svg";
import '../styles/Home.css'

// Configurable endpoint (VITE_NOTICIAS_API) or fallback
const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

// Tailwind gap "space-y-12" => 3rem => 48px
const NEWS_GAP_PX = 48;

// Brand accents
const BRAND_CYAN = "#22d3ee"; // cyan-400-ish
const BRAND_GRADIENT_FROM = "#0ea5e9"; // sky-500
const BRAND_GRADIENT_TO = "#0284c7"; // sky-600

// Inyectar @font-face para Amsterdam Four si no existe
if (typeof document !== "undefined" && !document.getElementById("amsterdam-four-font")) {
  const style = document.createElement("style");
  style.id = "amsterdam-four-font";
  style.innerHTML = `
    @font-face {
      font-family: 'Amsterdam Four';
      src: url('/amsterdam-four.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

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
function excerptFromMd(md = "", max = 200) {
  const raw = stripMarkdown(md);
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
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

  const top3 = useMemo(() => (noticias || []).slice(0, 3), [noticias]);
  const hasNoticias = top3.length > 0;

  // Measure a sample card height to size the empty-state box like 3 cards
  const measureRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(0);
  useEffect(() => {
    if (measureRef.current) {
      const h = measureRef.current.offsetHeight || 0;
      if (h && h !== cardHeight) setCardHeight(h);
    }
  }, [measureRef, cardHeight, hasNoticias, top3]);

  const emptyMinHeight = cardHeight
    ? 3 * cardHeight + 2 * NEWS_GAP_PX
    : undefined;

  return (
  <div className="min-h-screen flex flex-col bg-base-200 text-base-content w-full">
  {/* NAVBAR */}
  <Navbar transparent={!scrolled} />

      {/* HERO */}
      <section
        className="relative flex items-center justify-center w-full"
        style={{
          minHeight: '100vh',
          backgroundImage: "url('/fondohome.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          flex: 1,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }} />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center w-full" style={{ position: 'relative', zIndex: 2 }}>
          <div>
            <h1
              className="font-serif text-5xl sm:text-6xl lg:text-7xl italic tracking-wide mb-6"
              style={{
                color: BRAND_CYAN,
                fontFamily: 'Amsterdam Four, serif',
                letterSpacing: '0.04em',
              }}
            >
              Club del Parque
            </h1>
            <p className="opacity-80 font-medium italic">Tenis y pádel</p>
            <p className="opacity-70 mt-2">San José de Mayo, Uruguay</p>
            <div className="mt-10 flex gap-4">
              <button className="btn btn-primary">Ver Campeonatos</button>
              <Link to="/register" className="btn btn-outline">
                Registrarse
              </Link>
            </div>

            {(loading || fetchError) && (
              <p className="mt-6 text-sm opacity-70">
                {loading
                  ? "Cargando noticias…"
                  : `No se pudieron cargar noticias (${fetchError}).`}
              </p>
            )}
          </div>

          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Club del Parque Logo"
              className="h-90 w-auto opacity-100"
            />
          </div>
        </div>
      </section>

      {/* INSTALACIONES — gradient in brand blue family */}
      <section
        className="text-primary-content py-20"
        style={{
          backgroundImage: `linear-gradient(135deg, ${BRAND_GRADIENT_FROM} 0%, ${BRAND_GRADIENT_TO} 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold">Instalaciones</h2>
          <p className="mt-4 max-w-2xl opacity-95">
            Texto placeholder sobre las instalaciones. Cámbialo por tu propio
            contenido.
          </p>

          <div className="mt-12 grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <div className="card shadow-xl bg-base-200/20 backdrop-blur-[1px]">
                <div className="w-full h-[320px] bg-base-100/20 grid place-items-center rounded-box">
                  <span className="opacity-90">Mapa Placeholder</span>
                </div>
              </div>
              <p className="mt-6">
                Parque José Enrique Rodó
                <br />
                San José de Mayo, Uruguay
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="card shadow rounded-box bg-base-200/20 h-[120px] grid place-items-center"
                >
                  <span className="opacity-90 text-sm">Foto {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOTICIAS */}
      <section className="bg-white text-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
          <h2 className="text-5xl font-extrabold text-center mb-12">
            Noticias
          </h2>
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Lista principal */}
            <div className="lg:col-span-8 space-y-12 relative">
              {/* Hidden sample card to measure height */}
              <div
                className="absolute -left-[9999px] -top-[9999px]"
                aria-hidden
              >
                <ArticleCard
                  ref={measureRef}
                  id="measure"
                  date="01/01/2025"
                  title="Título de ejemplo para medir"
                  excerpt="Contenido de ejemplo para medir la altura de una tarjeta en la sección de noticias."
                />
              </div>

              {hasNoticias ? (
                <>
                  {top3.map((n) => {
                    const imgs = Array.isArray(n?.imagenes)
                      ? n.imagenes.map((it) => it?.imageUrl).filter(Boolean)
                      : [];
                    if (imgs.length === 0 && n?.imagenUrl)
                      imgs.push(n.imagenUrl); // legacy fallback

                    return (
                      <ArticleCard
                        key={n.id}
                        id={n.id}
                        date={
                          n?.fechaCreacion
                            ? new Date(n.fechaCreacion).toLocaleDateString()
                            : "—"
                        }
                        title={n?.titulo || "Título"}
                        excerpt={excerptFromMd(n?.mdContent || "", 200)}
                        images={imgs}
                      />
                    );
                  })}
                </>
              ) : (
                <div
                  className="card border border-neutral-200 bg-neutral-50 shadow"
                  style={{ minHeight: emptyMinHeight }}
                >
                  <div className="card-body items-center justify-center">
                    <p className="text-2xl font-extrabold m-0">
                      No hay noticias de momento
                    </p>
                  </div>
                </div>
              )}

              {/* Button stays at the same position */}
              <Link to="/noticias" className="btn btn-neutral">
                Ver más noticias
              </Link>
            </div>

            {/* Aside de últimos partidos */}
            <aside className="lg:col-span-4">
              <div className="card bg-neutral-900 text-neutral-content shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">Últimos partidos</h3>
                  <div className="mt-2 space-y-6">
                    {["3 - 5", "6 - 4", "7 - 5"].map((score, i) => (
                      <MatchRow key={i} score={score} />
                    ))}
                  </div>
                  <div className="card-actions mt-6">
                    <button className="btn btn-primary w-full">
                      Ver torneos
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

// forwardRef so we can measure this card’s height
const ArticleCard = React.forwardRef(function ArticleCard(
  { id, date, title, excerpt, images = [] },
  ref
) {
  const [idx, setIdx] = React.useState(0);
  const [fadeIn, setFadeIn] = React.useState(true);

  // rotate every 6s (respect reduced motion)
  React.useEffect(() => {
    if (!images.length) return;
    const mediaOK = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaOK?.matches) return;

    const t = setInterval(() => {
      setFadeIn(false);
      requestAnimationFrame(() => {
        setIdx((i) => (i + 1) % images.length);
        setFadeIn(true);
      });
    }, 6000);

    return () => clearInterval(t);
  }, [images.length]);

  // prefetch next image
  React.useEffect(() => {
    const next = images[(idx + 1) % images.length];
    if (next) {
      const img = new Image();
      img.src = next;
    }
  }, [idx, images]);

  const current = images[idx];

  return (
    <div
      ref={ref}
      className="card bg-white border border-base-200 shadow overflow-hidden rounded-xl"
    >
      {/* Two-column card: left image, right content */}
      <div className="grid grid-cols-[220px_1fr] md:grid-cols-[280px_1fr]">
        {/* LEFT: image (with soft fade/rotate) */}
        <div className="relative h-[160px] md:h-[190px]">
          {current ? (
            <>
              <img
                key={current}
                src={current}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: fadeIn ? 1 : 0,
                  transition: "opacity 700ms ease",
                }}
                loading="lazy"
              />
              {/* optional soft gradient on top of image */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0))",
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-base-200 grid place-items-center text-sm text-neutral-500">
              Sin imagen
            </div>
          )}
        </div>

        {/* RIGHT: content */}
        <div className="p-5 md:p-6">
          <h4 className="card-title m-0">{title}</h4>
          <p className="text-sm text-neutral/70 mt-1">{date}</p>
          <p className="mt-3 text-neutral-700 line-clamp-3">{excerpt}</p>
          <div className="card-actions mt-4">
            <Link to={`/noticias/${id}`} className="btn btn-neutral btn-sm">
              Ver Más ▷
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

function MatchRow({ score }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Jugador A</div>
          <div className="text-2xl font-extrabold">{score}</div>
          <div className="text-sm">Jugador B</div>
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="mt-3 divider m-0" />
    </div>
  );
}
