// src/pages/Homepage.jsx
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { noticias } from "../data/noticias";
import logoUrl from "../assets/Logo.png";

export default function Home() {
  return (
    <div className="min-h-[100svh] min-h-screen flex flex-col bg-neutral-800 text-white w-full">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden flex-1 flex items-center w-full">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center w-full">
          <div>
            <h1 className="text-sky-400 font-serif text-5xl sm:text-6xl lg:text-7xl italic tracking-wide mb-6">
              Club del Parque
            </h1>
            <p className="text-neutral-200/90 font-medium italic">Tenis y pádel</p>
            <p className="text-neutral-300 mt-2">San José de Mayo, Uruguay</p>
            <div className="mt-10 flex gap-4">
              <button className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-500 transition">
                Ver Campeonatos
              </button>
              <Link
                to="/register"
                className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
              >
                Registrarse
              </Link>
            </div>
          </div>

<div className="relative h-[300px] sm:h-[400px] lg:h-[500px] flex items-center justify-center">
  <img
    src={logoUrl}
    alt="Club del Parque Logo"
    className="h-full w-auto opacity-80"
  />
</div>

        </div>
      </section>

      {/* INSTALACIONES */}
      <section className="bg-sky-600 text-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold">Instalaciones</h2>
          <p className="mt-4 max-w-2xl">
            Texto placeholder sobre las instalaciones. Cámbialo por tu propio contenido.
          </p>

          <div className="mt-12 grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7">
              <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/10">
                <div className="w-full h-[320px] bg-neutral-200 grid place-items-center">
                  <span className="text-neutral-600">Mapa Placeholder</span>
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
                  className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-white h-[120px] grid place-items-center"
                >
                  <span className="text-neutral-500 text-sm">Foto {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOTICIAS */}
      <section className="bg-white text-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
          <h2 className="text-5xl font-extrabold text-center mb-12">Noticias</h2>
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Lista principal */}
            <div className="lg:col-span-8 space-y-12">
              {(noticias || []).slice(0, 3).map((n) => (
                <ArticleCard
                  key={n.id}
                  id={n.id}
                  date={n.fecha}
                  title={n.titulo}
                  excerpt={n.resumen}
                />
              ))}

              <Link
                to="/noticias"
                className="mt-4 inline-flex rounded-md bg-neutral-800 px-5 py-3 text-white font-semibold hover:bg-neutral-700"
              >
                Ver más noticias
              </Link>
            </div>

            {/* Aside de últimos partidos */}
            <aside className="lg:col-span-4">
              <div className="rounded-3xl bg-neutral-800 text-white p-6 shadow-xl">
                <h3 className="text-xl font-extrabold">Últimos partidos</h3>
                <div className="mt-6 space-y-6">
                  {["3 - 5", "6 - 4", "7 - 5"].map((score, i) => (
                    <MatchRow key={i} score={score} />
                  ))}
                </div>
                <button className="mt-8 inline-flex w-full justify-center rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-500">
                  Ver torneos
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function ArticleCard({ id, date, title, excerpt }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
      <h4 className="text-2xl font-extrabold">{title}</h4>
      <p className="text-sm text-neutral-500 mt-1">{date}</p>
      <p className="mt-3 text-neutral-700">{excerpt}</p>

      <Link
        to={`/noticias/${id}`}
        className="mt-4 inline-flex rounded-md bg-neutral-800 px-4 py-2 text-white text-sm hover:bg-neutral-700"
      >
        Ver Más ▷
      </Link>
    </article>
  );
}

function MatchRow({ score }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <span className="h-10 w-10 rounded-full bg-neutral-600" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Jugador A</div>
          <div className="text-2xl font-extrabold">{score}</div>
          <div className="text-sm">Jugador B</div>
        </div>
        <span className="h-10 w-10 rounded-full bg-neutral-600" />
      </div>
      <div className="mt-3 h-px w-full bg-white/15" />
    </div>
  );
}
