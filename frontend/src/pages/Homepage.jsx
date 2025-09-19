import React from "react";
import { Link } from 'react-router-dom';

import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-neutral-800 text-white">
      {/* NAVBAR */}
      <Navbar />
      {/* HERO */}
      <section className="relative overflow-hidden flex-1 flex items-center">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-sky-400 font-serif text-5xl sm:text-6xl lg:text-7xl italic tracking-wide mb-6">
              Club del Parque
            </h1>
            <p className="text-neutral-200/90 font-medium italic">TENIS Y PADEL</p>
            <p className="text-neutral-300 mt-2">San José de Mayo, Uruguay</p>
            <div className="mt-10 flex gap-4">
              <button className="rounded-full bg-sky-400 px-6 py-3 font-semibold text-white hover:bg-sky-500 transition">
                Ver Campeonatos
              </button>
              <Link to="/register" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition">
                Registrarse
              </Link>
            </div>
          </div>
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px]">
            <TennisBall className="absolute right-0 top-4 h-full w-auto" />
          </div>
        </div>
      </section>

      {/* INSTALACIONES */}
      <section className="bg-sky-400 text-neutral-900 py-20">
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
              <p className="mt-6">Parque José Enrique Rodó<br/>San José de Mayo, Uruguay</p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-white h-[120px] grid place-items-center">
                  <span className="text-neutral-500 text-sm">Foto {i+1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOTICIAS */}
      <section className="bg-white text-neutral-900 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-5xl font-extrabold text-center mb-12">NOTICIAS</h2>
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
              <ArticleCard
                date="31/08/2025"
                title="Lo último de Tenis en Uruguay"
                excerpt="Texto placeholder para la noticia."
              />
              <ArticleCard
                date="02/09/2025"
                title="Inscríbete al NUEVO Campeonato Recreativo"
                excerpt="Más detalles próximamente..."
              />
              <button className="mt-4 inline-flex rounded-md bg-neutral-800 px-5 py-3 text-white font-semibold hover:bg-neutral-700">
                VER MÁS NOTICIAS
              </button>
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-3xl bg-neutral-800 text-white p-6 shadow-xl">
                <h3 className="text-xl font-extrabold">ÚLTIMOS PARTIDOS</h3>
                <div className="mt-6 space-y-6">
                  {['3 - 5','6 - 4','7 - 5'].map((score, i) => (
                    <MatchRow key={i} score={score} />
                  ))}
                </div>
                <button className="mt-8 inline-flex w-full justify-center rounded-xl bg-sky-400 px-5 py-3 font-semibold text-white hover:bg-sky-500">
                  VER TORNEOS
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function Logo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#5ad0f5" />
      <path d="M7 16c0-5 4-9 9-9m9 9c0 5-4 9-9 9" stroke="#0e7490" strokeWidth="2" fill="none" />
    </svg>
  );
}

function TennisBall({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <circle cx="300" cy="300" r="260" fill="#4fd0ff" />
      <path d="M110,300c0-120,97-217,217-217" stroke="#2f2f2f" strokeWidth="28" fill="none" />
      <path d="M490,300c0,120-97,217-217,217" stroke="#2f2f2f" strokeWidth="28" fill="none" />
      <path d="M420,100c60,30,130,110,110,250" stroke="#2f2f2f" strokeWidth="28" fill="none" />
    </svg>
  );
}

function ArticleCard({ date, title, excerpt }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
      <h4 className="text-2xl font-extrabold">{title}</h4>
      <p className="text-sm text-neutral-500 mt-1">{date}</p>
      <p className="mt-3 text-neutral-700">{excerpt}</p>
      <button className="mt-4 inline-flex rounded-md bg-neutral-800 px-4 py-2 text-white text-sm hover:bg-neutral-700">
        Ver Más ▷
      </button>
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