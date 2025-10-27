// src/pages/Homepage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import logoUrl from "../assets/Logo.svg";
import "../styles/Home.css";
import RichTextEditor from "../components/RichTextEditor";

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

function cleanMdForPreview(md = "") {
  if (!md) return "";
  let s = String(md);

  s = s.replace(/^---[\s\S]*?---\s*/g, "");

  s = s.replace(/<[^>]+>/g, "");

  s = s.replace(/\{:\s*[^}]*\}/g, "");

  s = s.replace(/\[(\/)?[a-zA-Z0-9_-]+(?:[^\]]*)\]/g, "");

  s = s.replace(/[*_~]{1,}/g, "");

  s = s.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n");

  return s.trim();
}

function firstParagraph(md = "") {
  if (!md) return "";
  const parts = cleanMdForPreview(md).split(/\n{2,}/);
  // Return first non-empty block
  const p = parts.find((x) => x.trim().length > 0) || "";
  return p.trim();
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

      <Navbar transparent={!scrolled} color="white" />
      <section
        className="relative flex items-center justify-center w-full"
        style={{
          minHeight: "100vh",
          backgroundImage: "url('/fondohome.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          flex: 1,
          overflow: 'hidden'
        }}
      >
        <div className="absolute inset-0 bg-black/60 z-1" />
        <div
          className="relative z-2 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid grid-cols-1 md:grid-cols-2 gap-15 items-center w-full text-center md:text-left"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1
              className="font-serif text-4xl sm:text-5xl lg:text-7xl italic tracking-wide mb-6"
              style={{
                color: BRAND_CYAN,
                fontFamily: "Amsterdam Four, serif",
                letterSpacing: "0.04em",
              }}
            >
              Club del Parque
            </h1>
            <div>
              <p className="opacity-100 font-medium italic">Tenis y pádel</p>
              <p className="opacity-70 mt-2">San José de Mayo, Uruguay</p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/campeonatos" className="btn btn-primary w-full sm:w-auto " style={{ fontWeight: '300' }}>
                Ver Campeonatos
              </Link>
              <Link to="/register" className="btn btn-outline w-full sm:w-auto" style={{ fontWeight: '300' }}>
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

          <div className="relative h-[220px] sm:h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Club del Parque Logo"
              className="max-h-full w-auto opacity-100 transition-all"
            />
          </div>
        </div>
      </section>
      <section
  className="text-primary-content"
  style={{
    backgroundColor: "white",
  }}
>
  <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
    <h2
      className="text-3xl sm:text-4xl font-extrabold text-center"
      style={{ color: "var(--neutro)" }}
    >
      Instalaciones
    </h2>
    <p
      style={{ color: "gray" }}
      className="mt-4 max-w-2xl text-center opacity-95 mx-auto"
    >
      Canchas de tenis y pádel en un entorno natural y acogedor.
    </p>

    <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Mapa y descripción */}
      <div className="lg:col-span-7">
        <div className="card shadow-xl bg-base-200/20 backdrop-blur-[1px]">
          <div className="w-full h-[220px] sm:h-[320px] lg:h-[400px] rounded-box overflow-hidden">
            <iframe
              title="Ubicación Club del Parque"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d898.2212405698841!2d-56.731551567172225!3d-34.33291067375281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a17751d22bfc15%3A0x1a83f754b3962b69!2sClub%20del%20Parque%20(Canchas%20tenis)!5e0!3m2!1ses!2suy!4v1761506263634!5m2!1ses!2suy"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        <p
          className="mt-6 text-center lg:text-left"
          style={{ color: "gray" }}
        >
          Parque José Enrique Rodó
          <br />
          San José de Mayo, Uruguay
        </p>
      </div>

      {/* Galería de imágenes */}
      <div className="lg:col-span-5">
        <div
          className="
            grid 
            grid-cols-1
            xs:grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-2
            gap-4
          "
        >
          {["/img1.jpeg", "/img2.jpeg", "/img3.jpeg", "/img4.jpeg"].map(
            (src, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden shadow-lg group"
              >
                <img
                  src={src}
                  alt={`Instalación ${i + 1}`}
                  className="
                    w-full 
                    h-[220px] 
                    sm:h-[200px] 
                    lg:h-[220px] 
                    object-cover 
                    transform 
                    group-hover:scale-105 
                    transition-transform 
                    duration-500 
                    ease-in-out
                  "
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  </div>
</section>


      <section className="bg-gradient-to-b from-white via-sky-50 to-white text-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
          {/* Título */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4" style={{ color: 'var(--neutro)' }}>
            Noticias
          </h2>
          <p className="text-center text-gray-500 max-w-2xl mx-auto mb-12">
            Mantente al día con los torneos, eventos y novedades del Club del Parque.
          </p>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Bloque principal de noticias */}
            <div className="lg:col-span-8 space-y-10 relative">
              {/* Hidden measure card */}
              <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden>
                <ArticleCard
                  ref={measureRef}
                  id="measure"
                  date="01/01/2025"
                  title="Título de ejemplo"
                  excerptMd="Texto de prueba para calcular la altura de una tarjeta."
                />
              </div>

              {/* Noticias */}
              {hasNoticias ? (
                <div className="grid sm:grid-cols-2 gap-8">
                  {top3.map((n) => {
                    const imgs = Array.isArray(n?.imagenes)
                      ? n.imagenes.map((it) => it?.imageUrl).filter(Boolean)
                      : [];
                    if (imgs.length === 0 && n?.imagenUrl) imgs.push(n.imagenUrl);

                    return (
                      <div
                        key={n.id}
                        className="group bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-500"
                      >
                        {/* Imagen destacada */}
                        <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden">
                          {imgs.length ? (
                            <img
                              src={imgs[0]}
                              alt={n?.titulo || "Noticia"}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 grid place-items-center text-gray-400 text-sm">
                              Sin imagen
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>

                        {/* Contenido */}
                        <div className="p-5 flex flex-col gap-3">
                          <h3 className="font-bold text-lg group-hover:text-sky-700 transition-colors">
                            {n?.titulo || "Título"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {n?.fechaCreacion
                              ? new Date(n.fechaCreacion).toLocaleDateString()
                              : "—"}
                          </p>
                          <p className="text-gray-700 line-clamp-3 leading-snug">
                            {firstParagraph(n?.mdContent || "")}
                          </p>
                          <Link
                            to={`/noticias/${n.id}`}
                            className="mt-3 inline-block text-sky-600 font-medium hover:underline"
                          >
                            Leer más →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="card border border-neutral-200 bg-neutral-50 shadow h-64 grid place-items-center"
                  style={{ minHeight: emptyMinHeight }}
                >
                  <p className="text-xl font-semibold text-gray-500">
                    No hay noticias disponibles
                  </p>
                </div>
              )}

              {/* Botón de ver más */}
              <div className="flex justify-center mt-10">
                <Link
                  to="/noticias"
                  className="btn btn-primary px-8 text-lg tracking-wide shadow-md hover:shadow-lg"
                >
                  Ver más noticias
                </Link>
              </div>
            </div>

            {/* Aside de últimos partidos */}
            <aside className="lg:col-span-4">
              <div className="card bg-neutral-900 text-neutral-content shadow-xl rounded-2xl overflow-hidden">
                <div className="card-body">
                  <h3 className="card-title text-lg font-semibold">Últimos partidos</h3>
                  <div className="mt-4 space-y-6">
                    {["3 - 5", "6 - 4", "7 - 5"].map((score, i) => (
                      <MatchRow key={i} score={score} />
                    ))}
                  </div>
                  <div className="card-actions mt-8">
                    <button className="btn btn-primary w-full">Ver torneos</button>
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
  { id, date, title, excerptMd, images = [] },
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
    <div ref={ref} className="card bg-white border border-base-200 shadow overflow-hidden rounded-xl">
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
                  background: "linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0))",
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-base-200 grid place-items-center text-sm text-neutral-500">
              Sin imagen
            </div>
          )}
        </div>

        <div className="p-5 md:p-6">
          <h4 className="card-title m-0">{title}</h4>
          <p className="text-sm text-neutral/70 mt-1">{date}</p>

          {/* Preview rendered with the same viewer, but only first paragraph and transparent */}
          <div className="mt-3 text-neutral-700">
            <RichTextEditor
              valueMarkdown={firstParagraph(excerptMd)}
              readOnly
              hideToolbar
              transparent
              autoHeight
              className="!rounded-none !overflow-visible"
            />
          </div>

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
