// src/pages/Homepage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco";
import logoUrl from "../assets/Logo.svg";
import "../styles/Home.css";
import RichTextEditor from "../components/RichTextEditor";
import { useAuth } from "../contexts/AuthProvider";
import { noticias as noticiasData } from "../data/noticias";

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
      z-index: 1000;
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
    .leaflet-container {
      z-index: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

// Brand accents
const BRAND_CYAN = "#22d3ee";

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
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const { user } = useAuth();

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
    <>
      <NavbarBlanco transparent={true} />

      {/* Hero Section */}
      <section
        className="flex items-center justify-center w-full"
        style={{
          minHeight: "100vh",
          backgroundImage: "url('/fondohome.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          position: "relative",
        }}
      >
        <div className="relative z-2 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 grid grid-cols-1 md:grid-cols-2 gap-15 items-center w-full text-center md:text-left">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <h1
              className="font-serif text-4xl sm:text-5xl lg:text-7xl italic tracking-wide mb-6"
              style={{
                textAlign: 'center',
                color: BRAND_CYAN,
                fontFamily: "Amsterdam Four, serif",
                letterSpacing: "0.04em",
              }}
            >
              Club del Parque
            </h1>
            <p className="mt-2 text-cyan-300 text-center">
              Tenis y pádel. <br />
              San José de Mayo, Uruguay
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                to="/campeonatos"
                style={{ backgroundColor: 'var(--primario)', padding: '10px 20px', cursor: 'pointer' }}
                className="py-2 text-white rounded w-full text-center"
              >
                Ver Campeonatos
              </Link>
              {!user &&
                <Link to="/register" style={{backgroundColor: 'white', padding: '10px 20px', cursor: 'pointer', border: '1px solid var(--primario)'}} className="py-2 text-black rounded">
                  Registrarse
                </Link>
              }
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

      {/* Sección de Instalaciones */}
      <section className="w-full bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: "var(--neutro)" }}>
              Nuestras Instalaciones
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Canchas de tenis y pádel en un entorno natural y acogedor en el corazón de San José de Mayo.
            </p>

          </div>
          {/* Mapa */}
          <div className="mb-16">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-[450px] w-full">
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
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-gray-800 font-semibold">Parque José Enrique Rodó</p>
                    <p className="text-gray-600">San José de Mayo, Uruguay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Galería de Fotos */}
          <div>
            <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: "var(--neutro)" }}>
              Galería de Fotos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CANCHAS_IMAGES.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPhotoIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`Cancha ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sección de Noticias */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold mb-6 text-center" style={{ color: "var(--neutro)" }}>
              Noticias
            </h3>

            {/* Preparar lista segura (más recientes primero) */}
            {(() => {
              const list = Array.isArray(noticiasData) ? [...noticiasData].reverse().slice(0, 3) : [];
              if (!list || list.length === 0) {
                return (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No hay noticias publicadas por el momento.</p>
                    <Link to="/noticias" className="inline-block bg-primario text-white px-4 py-2 rounded">
                      Ver Noticias
                    </Link>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {list.map((n) => (
                    <article key={n.id} className="bg-white rounded-2xl shadow p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold mb-2" style={{ color: "var(--neutro)" }}>{n.titulo}</h4>
                          <p className="text-sm text-gray-500 mb-3">{n.fecha}</p>
                          <p className="text-gray-700 mb-4">{n.resumen}</p>
                          <div className="mt-auto">
                            <Link
                              to={`/noticias/${n.id}`}
                              className="text-primario font-semibold hover:underline"
                            >
                              Leer más
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </section>


      {/* Sección de reportes */}
      <section className="bg-gray-100 py-10 mt-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">¿Tienes algún problema?</h2>
          <p className="mb-4 text-gray-700">Envíanos tu reporte y te ayudaremos lo antes posible.</p>
          <Link
          style={{ backgroundColor: 'var(--primario)', padding: '10px 20px', cursor: 'pointer' }}
                className="py-2 text-white rounded w-full text-center"
            to="/reportes"
            // className="inline-block bg-primario text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-primario-dark transition"
          >
            Ir a reportes
          </Link>
        </div>
      </section>

      <Footer/>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div
          className="LightboxOverlay"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
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
    </>
  );
}
