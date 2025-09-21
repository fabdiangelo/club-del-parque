import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { noticias } from "../data/noticias";
//import logoUrl from "../assets/Logo.png";

export default function Noticias() {
  return (
    <div className="min-h-dvh w-full bg-[#242424] text-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Noticias
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Todas las novedades del club (placeholders).
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["Todas", "Club", "Torneos", "Ranking"].map((f) => (
              <button
                key={f}
                className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-sm"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de noticias */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {noticias.map((n) => (
              <article
                key={n.id}
                className="rounded-2xl bg-[#2f2f2f] shadow hover:shadow-lg transition overflow-hidden flex flex-col"
              >
                {/* Placeholder de imagen */}
                <div className="aspect-[16/9] bg-gray-700/60" />
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs uppercase tracking-wider text-white/60">
                    {n.fecha}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{n.titulo}</h2>
                  <p className="mt-2 text-white/80 text-sm leading-relaxed flex-1">
                    {n.resumen}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/noticias/${n.id}`}
                      className="rounded-md px-3 py-1.5 text-sm hover:bg-grey-100 transition"
                    >
                      Leer más
                    </Link>
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Paginación placeholder */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
