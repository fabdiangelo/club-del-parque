import React, { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const PLACEHOLDER_ROWS = [
  { rank: 1, name: "Ana Pereira", wins: 12, losses: 2, points: 1240 },
  { rank: 2, name: "Marcos Gómez", wins: 10, losses: 4, points: 1100 },
  { rank: 3, name: "Lucía Rodríguez", wins: 8, losses: 5, points: 980 },
  { rank: 4, name: "Diego Fernández", wins: 7, losses: 6, points: 910 },
  { rank: 5, name: "Sofía Cabrera", wins: 6, losses: 7, points: 860 },
  { rank: 6, name: "Julián Viera", wins: 6, losses: 8, points: 820 },
  { rank: 7, name: "Valentina López", wins: 5, losses: 9, points: 790 },
  { rank: 8, name: "Tomás Silva", wins: 4, losses: 10, points: 760 },
];

const BRAND_CYAN = "#22d3ee"; 

export default function Rankings() {
  const [category, setCategory] = useState("Singles");
  const [season, setSeason] = useState("2025");

  const rows = useMemo(() => PLACEHOLDER_ROWS, []);

  return (
    <div className="min-h-screen w-full flex flex-col text-base-content">
      <Navbar />

      {/* HERO / HEADER */}
      <header
        className="relative w-full"
        style={{
          // --- Tennis grass background (CSS-only) ---
          // 1) base green gradient
          // 2) subtle noise via radial-gradients
          // 3) light pitch stripes using repeating-linear-gradient
          backgroundImage: [
            // stripes (vertical on desktop)
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.0) 6px, rgba(255,255,255,0.0) 22px)",
            // soft mottled texture
            "radial-gradient(1200px 400px at 30% 20%, rgba(255,255,255,0.06), rgba(0,0,0,0) 60%)",
            "radial-gradient(800px 300px at 70% 80%, rgba(0,0,0,0.08), rgba(0,0,0,0) 60%)",
            // base field
            "linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%)",
          ].join(","),
          backgroundSize: "auto, cover, cover, cover",
          color: "white",
        }}
      >
        {/* overlay to improve contrast */}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1
            className="text-5xl sm:text-6xl font-black tracking-tight"
            style={{
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              borderBottom: `4px solid ${BRAND_CYAN}`,
              display: "inline-block",
              paddingBottom: "0.25rem",
            }}
          >
            Rankings
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg opacity-95">
            {/* Placeholder description */}
            Clasificación general — <span className="font-semibold">Categoría</span>: {category} · <span className="font-semibold">Modalidad</span>: "placeholder" (individual/dobles).
          </p>

          {/* Controls (purely cosmetic now) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <div className="join">
              <button onClick={() => setCategory("Singles")} className={`btn join-item ${category === "Singles" ? "btn-primary" : "btn-ghost"}`}>Singles</button>
              <button onClick={() => setCategory("Doubles")} className={`btn join-item ${category === "Doubles" ? "btn-primary" : "btn-ghost"}`}>Doubles</button>
              <button onClick={() => setCategory("Mixto")} className={`btn join-item ${category === "Mixto" ? "btn-primary" : "btn-ghost"}`}>Mixto</button>
            </div>
            <select
              className="select select-bordered"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              aria-label="Temporada"
            >
              <option value="2025">Temporada 2025</option>
              <option value="2024">Temporada 2024</option>
              <option value="2023">Temporada 2023</option>
            </select>
          </div>

          {/* Optional: link to rules or how the ranking is calculated */}
          <div className="mt-4">
            <Link to="/reglamento" className="link link-hover opacity-90">
              Ver reglas y cálculo de puntos (placeholder)
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN TABLE */}
      <main className="flex-1 bg-base-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
          <div className="card shadow-xl border border-base-300 bg-white/90 backdrop-blur">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <h2 className="card-title text-2xl">Tabla de posiciones</h2>
                  <p className="text-sm opacity-70">Datos de ejemplo — cada fila representa a una persona.</p>
                </div>
                <button className="btn btn-neutral btn-sm">Exportar CSV (placeholder)</button>
              </div>

              <div className="overflow-x-auto mt-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Jugador/a</th>
                      <th>PG</th>
                      <th>PP</th>
                      <th>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rank} className="hover">
                        <td className="font-bold">{r.rank}</td>
                        <td>{r.name}</td>
                        <td>{r.wins}</td>
                        <td>{r.losses}</td>
                        <td className="font-semibold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile condensed list (optional) */}
              <div className="mt-6 grid sm:hidden gap-3">
                {rows.map((r) => (
                  <div key={r.rank} className="rounded-box border border-base-300 p-4 bg-base-100">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-extrabold">#{r.rank} · {r.name}</div>
                      <div className="text-sm opacity-70">{season} · {category}</div>
                    </div>
                    <div className="mt-2 text-sm">PG: <span className="font-semibold">{r.wins}</span> · PP: <span className="font-semibold">{r.losses}</span></div>
                    <div className="text-sm">Puntos: <span className="font-semibold">{r.points}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TODO for you: swap background if you prefer an image */}
          <div className="mt-10 text-sm opacity-70">
            <p>
              ¿Quieres un césped más realista? Reemplaza el encabezado por una imagen:
            </p>
            <pre className="mt-2 bg-base-300/50 p-3 rounded-box overflow-x-auto text-xs">
{`// In <header style={{ backgroundImage: ... }} /> replace with
style={{
  backgroundImage: "url('/tennis-grass.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
