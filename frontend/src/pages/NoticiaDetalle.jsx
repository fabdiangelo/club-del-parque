// src/pages/NoticiaDetalle.jsx
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { noticias } from "../data/noticias";

export default function NoticiaDetalle() {
  const { id } = useParams();
  const noticia = noticias.find((n) => String(n.id) === String(id));

  // Asegura que arranca arriba al entrar a la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!noticia) {
    return (
      <div className="min-h-dvh w-full bg-[#242424] text-white flex flex-col">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl bg-[#2f2f2f] p-8">
            <h1 className="text-2xl font-semibold">Noticia no encontrada</h1>
            <p className="mt-2 text-white/70">
              La noticia que intentas ver no existe o fue movida.
            </p>
            <Link
              to="/noticias"
              className="mt-6 inline-block rounded-full bg-white/10 hover:bg-white/20 px-4 py-2"
            >
              ← Volver a Noticias
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-[#242424] text-white flex flex-col">
      <Navbar />

      {/* Encabezado */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link
            to="/noticias"
            className="mb-6 inline-block rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-sm"
          >
            ← Volver a Noticias
          </Link>

          <p className="text-xs uppercase tracking-wider text-white/60">
            {noticia.fecha}
          </p>
          <h1 className="mt-1 text-4xl md:text-5xl font-extrabold tracking-tight">
            {noticia.titulo}
          </h1>

          {/* Media placeholder */}
          <div className="mt-8 aspect-[16/9] w-full rounded-2xl bg-gray-700/60" />

          {/* Contenido + Sidebar */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Cuerpo */}
            <article className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed whitespace-pre-line">
                {noticia.cuerpo}
              </p>

              <p className="text-white/80 leading-relaxed mt-4">
                Más texto placeholder… Lorem ipsum dolor sit amet, consectetur
                adipiscing elit. Quisque blandit, odio eget hendrerit porttitor.
              </p>

              <blockquote className="mt-6 border-l-4 border-sky-500 pl-4 text-white/90">
                “Cita placeholder relacionada a la noticia.”
              </blockquote>

              <p className="text-white/80 leading-relaxed mt-6">
                Cierre de la noticia con información adicional (simulado).
              </p>
            </article>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="rounded-2xl bg-[#2f2f2f] p-5">
                <h3 className="text-lg font-semibold">Compartir</h3>
                <div className="mt-3 flex gap-2">
                  {["X", "FB", "IG"].map((s) => (
                    <button
                      key={s}
                      className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm"
                      onClick={() => {}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#2f2f2f] p-5">
                <h3 className="text-lg font-semibold">Relacionadas</h3>
                <ul className="mt-3 space-y-3">
                  {noticias
                    .filter((n) => n.id !== noticia.id)
                    .slice(0, 3)
                    .map((rel) => (
                      <li key={rel.id} className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-white/10" />
                        <div className="flex-1">
                          <Link
                            to={`/noticias/${rel.id}`}
                            className="text-sm leading-tight hover:underline"
                          >
                            {rel.titulo}
                          </Link>
                          <p className="text-xs text-white/60">{rel.fecha}</p>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA inferior */}
      <section className="bg-[#1f6b82] py-10 mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <p className="text-white/95">
            ¿Te gustó esta noticia? (placeholder)
          </p>
          <button className="rounded-full bg-white text-[#1f6b82] px-6 py-2 font-medium hover:opacity-90">
            Compartir
          </button>
        </div>
      </section>
    </div>
  );
}
