import { useMemo, useState } from "react";
import useTemporadas from "../hooks/useTemporadas";
import Navbar from "../components/Navbar";
import { CalendarPlus, Check } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";

const NAVBAR_OFFSET_REM = 5;

export default function TemporadasPage() {
  const { items, loading, error, create } = useTemporadas();

  // Defaults: hoy → +6 meses
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sixMonthsLaterISO = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    fechaInicio: todayISO,
    fechaFin: sixMonthsLaterISO,
  });
  const [ok, setOk] = useState("");

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk("");
    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      alert("Las fechas inicio/fin son obligatorias");
      return;
    }
    const success = await create(form);
    if (success) {
      setOk("Temporada creada");
      setForm({
        nombre: "",
        fechaInicio: todayISO,
        fechaFin: sixMonthsLaterISO,
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white">
      <div
        aria-hidden
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <header className="w-full">
          <div
            className="mx-auto max-w-7xl px-6 lg:px-8"
            style={{ paddingTop: `${NAVBAR_OFFSET_REM}rem`, paddingBottom: "1.25rem" }}
          >
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-xl">
              Temporadas
            </h1>
            <p className="mt-3 text-white/80">
              Administrador de temporadas (solo creación).
            </p>
          </div>
        </header>

        <main className="flex-1 pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
            {/* Form card */}
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm p-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                <CalendarPlus className="w-6 h-6" /> Crear nueva temporada
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm mb-1 text-white/80">Nombre</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    placeholder="Ej. Temporada 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/80">Inicio</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="date"
                    name="fechaInicio"
                    value={form.fechaInicio}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/80">Fin</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="date"
                    name="fechaFin"
                    value={form.fechaFin}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-cyan-700/90 hover:bg-cyan-700 disabled:opacity-60 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                >
                  {loading ? "Creando…" : (<> <CalendarPlus className="w-5 h-5" /> Crear </>)}
                </button>

                {ok && (
                  <span className="inline-flex items-center gap-2 text-green-300">
                    <Check className="w-5 h-5" />
                    {ok}
                  </span>
                )}
                {error && <span className="text-rose-300">{error}</span>}
              </div>
            </form>

            {/* List card */}
            <div className="rounded-2xl border border-white/20 bg-neutral-900/70 shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold">Listado</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="bg-neutral-800/80 text-base sm:text-lg">
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Nombre</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Inicio</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Fin</th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center border-t border-white/10 text-white/70">
                          No hay temporadas.
                        </td>
                      </tr>
                    )}
                    {items.map((t, i) => (
                      <tr
                        key={t.id || `${t.nombre}-${t.fechaInicio}-${i}`}
                        className={`transition-colors hover:bg-neutral-800/60 ${
                          i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                        }`}
                      >
                        <td className="px-6 py-4 border-t border-white/10">{t.nombre ?? "—"}</td>
                        <td className="px-6 py-4 border-t border-white/10">{t.fechaInicio ?? "—"}</td>
                        <td className="px-6 py-4 border-t border-white/10">{t.fechaFin ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
