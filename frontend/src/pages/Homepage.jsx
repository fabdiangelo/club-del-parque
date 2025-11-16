// src/pages/Homepage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco";
import logoUrl from "../assets/Logo.svg";
import "../styles/Home.css";
import RichTextEditor from "../components/RichTextEditor";

// === Canchas photos
import img1 from "../assets/CanchasTenisPadel/1.jpg";
import img2 from "../assets/CanchasTenisPadel/2.jpg";
import img3 from "../assets/CanchasTenisPadel/3.jpg";
import img4 from "../assets/CanchasTenisPadel/4.jpg";
import img5 from "../assets/CanchasTenisPadel/5.jpg";
import img6 from "../assets/CanchasTenisPadel/6.jpg";
const CANCHAS_IMAGES = [img1, img2, img3, img4, img5, img6];

// === Leaflet map
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Small CSS for our custom Leaflet divIcon + lightbox
if (typeof document !== "undefined" && !document.getElementById("club-custom-css")) {
  const style = document.createElement("style");
  style.id = "club-custom-css";
  style.innerHTML = `
    .tennis-marker {
      font-size: 28px;
      line-height: 28px;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,.35));
      transform: translateY(-4px);
    }
    .LightboxOverlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.9);
      display: flex; align-items: center; justify-content: center;
      z-index: 60;
    }
    .LightboxContent {
      position: relative; max-width: min(95vw, 1200px); max-height: 90vh;
    }
    .LightboxContent img {
      width: 100%; height: auto; max-height: 70vh; object-fit: contain; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,.5);
    }
    .LightboxBtn {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.25);
      width: 44px; height: 44px; border-radius: 9999px; display: grid; place-items: center;
      cursor: pointer; user-select: none;
    }
    .LightboxBtn:hover { background: rgba(255,255,255,.25); }
    .LightboxPrev { left: -56px; }
    .LightboxNext { right: -56px; }
    .LightboxClose {
      position: absolute; top: -56px; right: 0;
      width: 40px; height: 40px; border-radius: 9999px;
      background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.25);
      display: grid; place-items: center; cursor: pointer;
    }
    @media (max-width: 768px) {
      .LightboxPrev { left: 8px; }
      .LightboxNext { right: 8px; }
      .LightboxClose { top: 8px; right: 8px; }
    }
  `;
  document.head.appendChild(style);
}

// Configurable endpoint (VITE_NOTICIAS_API) or fallback
const NOTICIAS_ENDPOINT =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_NOTICIAS_API) ||
  "/api/noticias";

// Tailwind gap "space-y-12" => 3rem => 48px
const NEWS_GAP_PX = 48;

// Brand accents
const BRAND_CYAN = "#22d3ee";
const BRAND_GRADIENT_FROM = "#0ea5e9";
const BRAND_GRADIENT_TO = "#0284c7";

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
  const p = parts.find((x) => x.trim().length > 0) || "";
  return p.trim();
}

// Map center
const CLUB_LAT = -34.33312002069657;
const CLUB_LNG = -56.730515149400006;

// Create a custom tennis-ball marker (emoji in a divIcon)
const TennisIcon = L.divIcon({
  className: "tennis-marker",
  html: "🎾",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


 



  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // lightbox keyboard handlers
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight")
        setPhotoIndex((i) => (i + 1) % CANCHAS_IMAGES.length);
      if (e.key === "ArrowLeft")
        setPhotoIndex((i) => (i + CANCHAS_IMAGES.length - 1) % CANCHAS_IMAGES.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  return (
    <div>

      <NavbarBlanco transparent={true} />
      <section
  className="homepage-section relative flex items-center justify-center w-full"
  style={{
    minHeight: "100vh",
    backgroundImage: "url('/fondohome.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }}
>
        <div className="absolute inset-0  z-1" />
        <div className="relative z-2 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid grid-cols-1 md:grid-cols-2 gap-15 items-center w-full text-center md:text-left">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
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
            <p className="opacity-90 font-medium italic text-cyan-200"></p>
            <p className="mt-2 text-cyan-300 text-center">Tenis y pádel. <br></br>San José de Mayo, Uruguay</p>
            <div className="mt-10 flex gap-4">
              <Link to="/campeonatos" style={{backgroundColor: 'var(--primario)', padding: '10px 20px', cursor: 'pointer'}} className="py-2 text-white rounded w-full text-center">
                Ver Campeonatos
              </Link>
              <Link to="/register" style={{backgroundColor: 'white', padding: '10px 20px', cursor: 'pointer', border: '1px solid var(--primario)'}} className="py-2 text-black rounded">
                Registrarse
              </Link>
            </div>

           
          </div>

          <div className="relative h-[220px] sm:h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Club del Parque Logo"
              className="logo-pelota max-h-full w-auto opacity-100 transition-all"
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
        <div className="mx-auto max-w-7xl px-6 py-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center" style={{ color: "var(--neutro)" }}>
            Instalaciones
          </h2>
          <p style={{ color: "gray" }} className="mt-4 max-w-2xl text-center opacity-95 mx-auto">
            Canchas de tenis y pádel en un entorno natural y acogedor.
          </p>

          <div className="mt-12 grid lg:grid-cols-12 gap-10">
            {/* MAP */}
            <div className="lg:col-span-7">
              <div className="card shadow-xl bg-base-200/20 backdrop-blur-[1px]">
                <div className="w-full h-[340px] rounded-box overflow-hidden">
                  <MapContainer
                    center={[CLUB_LAT, CLUB_LNG]}
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[CLUB_LAT, CLUB_LNG]} icon={TennisIcon}>
                      <Popup>
                        <strong>Club del Parque</strong>
                        <br />
                        San José de Mayo, Uruguay
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
              <p className="mt-6" style={{ color: "gray" }}>
                Parque José Enrique Rodó
                <br />
                San José de Mayo, Uruguay
              </p>
            </div>

            {/* PHOTOS */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-6">
              {CANCHAS_IMAGES.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  className="card shadow rounded-box bg-base-200/20 h-[160px] overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setPhotoIndex(i);
                    setLightboxOpen(true);
                  }}
                  aria-label={`Abrir foto ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`Cancha ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      

      <Footer />

      {/* LIGHTBOX (no deps) */}
      {lightboxOpen && (
        <div
          className="LightboxOverlay"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          style={{zIndex: 1000}}
          aria-modal="true"
        >
          <div className="LightboxContent" onClick={(e) => e.stopPropagation()}>
            <img src={CANCHAS_IMAGES[photoIndex]} alt={`Foto ${photoIndex + 1}`} />
            <button
              className="LightboxBtn LightboxPrev"
              onClick={() =>
                setPhotoIndex((i) => (i + CANCHAS_IMAGES.length - 1) % CANCHAS_IMAGES.length)
              }
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="LightboxBtn LightboxNext"
              onClick={() => setPhotoIndex((i) => (i + 1) % CANCHAS_IMAGES.length)}
              aria-label="Siguiente"
            >
              ›
            </button>
            <button
              className="LightboxClose"
              onClick={() => setLightboxOpen(false)}
              aria-label="Cerrar"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// /* ---------- Subcomponentes ---------- */

// const ArticleCard = React.forwardRef(function ArticleCard(
//   { id, date, title, excerptMd, images = [] },
//   ref
// ) {
//   const [idx, setIdx] = React.useState(0);
//   const [fadeIn, setFadeIn] = React.useState(true);

//   React.useEffect(() => {
//     if (!images.length) return;
//     const mediaOK = window.matchMedia?.("(prefers-reduced-motion: reduce)");
//     if (mediaOK?.matches) return;
//     const t = setInterval(() => {
//       setFadeIn(false);
//       requestAnimationFrame(() => {
//         setIdx((i) => (i + 1) % images.length);
//         setFadeIn(true);
//       });
//     }, 6000);
//     return () => clearInterval(t);
//   }, [images.length]);

//   React.useEffect(() => {
//     const next = images[(idx + 1) % images.length];
//     if (next) {
//       const img = new Image();
//       img.src = next;
//     }
//   }, [idx, images]);

//   const current = images[idx];

//   return (
//     <div ref={ref} className="card bg-white border border-base-200 shadow overflow-hidden rounded-xl">
//       <div className="grid grid-cols-[220px_1fr] md:grid-cols-[280px_1fr]">
//         <div className="relative h-[160px] md:h-[190px]">
//           {current ? (
//             <>
//               <img
//                 key={current}
//                 src={current}
//                 alt=""
//                 className="absolute inset-0 w-full h-full object-cover"
//                 style={{ opacity: fadeIn ? 1 : 0, transition: "opacity 700ms ease" }}
//                 loading="lazy"
//               />
//               <div
//                 className="absolute inset-0 pointer-events-none"
//                 style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0))" }}
//               />
//             </>
//           ) : (
//             <div className="absolute inset-0 bg-base-200 grid place-items-center text-sm text-neutral-500">
//               Sin imagen
//             </div>
//           )}
//         </div>

//         <div className="p-5 md:p-6">
//           <h4 className="card-title m-0">{title}</h4>
//           <p className="text-sm text-neutral/70 mt-1">{date}</p>
//           <div className="mt-3 text-neutral-700">
//             <RichTextEditor
//               valueMarkdown={firstParagraph(excerptMd)}
//               readOnly
//               hideToolbar
//               transparent
//               autoHeight
//               className="!rounded-none !overflow-visible"
//             />
//           </div>
//           <div className="card-actions mt-4">
//             <Link to={`/noticias/${id}`} className="btn btn-neutral btn-sm">
//               Ver Más ▷
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

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
