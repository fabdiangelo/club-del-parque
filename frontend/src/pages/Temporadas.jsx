// src/pages/TemporadasPage.jsx (tema claro)
import { useMemo, useState } from "react";
import useTemporadas from "../hooks/useTemporadas";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { AlertTriangle, CalendarPlus, Check } from "lucide-react";
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
  const [ack, setAck] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

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
    if (!ack) {
      alert("Debes confirmar que entiendes que las temporadas no se pueden eliminar.");
      return;
    }

    const success = await create(form);
    if (success) {
      setOk("Temporada creada");
      setForm({ nombre: "", fechaInicio: todayISO, fechaFin: sixMonthsLaterISO });
      setAck(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900">
      
      <div className="fixed inset-0 z-0 bg-white/70 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavbarBlanco />

        <header className="w-full">
          <div
            className="mx-auto max-w-7xl px-6 lg:px-8"
            style={{ paddingTop: `${NAVBAR_OFFSET_REM}rem`, paddingBottom: "1.25rem" }}
          >
            
            <p className="mt-3 text-slate-600"></p>
          </div>
        </header>

        <main className="flex-1 pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-8">
            {/* Form card */}
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm p-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                <CalendarPlus className="w-6 h-6" /> Crear nueva temporada
              </h2>

              {/* ⚠️ Irreversible warning */}
              <div className="mb-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      Atención: las temporadas no se pueden eliminar una vez creadas.
                    </p>
                    <p className="text-slate-700 mt-1">
                      Revisa cuidadosamente el <strong>nombre</strong> y las <strong>fechas de inicio y fin</strong> antes de confirmar.
                    </p>
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-slate-400"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  <span className="text-slate-700">
                    Entiendo que no podré eliminar esta temporada más adelante.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm mb-1 text-slate-700">Nombre</label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={onChange}
                    placeholder="Ej. Temporada 2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-700">Inicio</label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="date"
                    name="fechaInicio"
                    value={form.fechaInicio}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-700">Fin</label>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
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
                  disabled={loading || !ack}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 active:scale-[.98] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                  title={!ack ? "Debes aceptar la advertencia" : undefined}
                >
                  {loading ? "Creando…" : (<><CalendarPlus className="w-5 h-5" /> Crear</>)}
                </button>

                {ok && (
                  <span className="inline-flex items-center gap-2 text-green-700">
                    <Check className="w-5 h-5" />
                    {ok}
                  </span>
                )}
                {error && <span className="text-rose-600">{error}</span>}
              </div>
            </form>

            {/* List card */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <h2 className="text-xl sm:text-2xl font-bold">Listado</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-900">
                  <thead>
                    <tr className="bg-slate-100 text-base sm:text-lg">
                      <th className="px-6 py-4 font-semibold border-y border-slate-200">Nombre</th>
                      <th className="px-6 py-4 font-semibold border-y border-slate-200">Inicio</th>
                      <th className="px-6 py-4 font-semibold border-y border-slate-200">Fin</th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center border-t border-slate-200 text-slate-500">
                          No hay temporadas.
                        </td>
                      </tr>
                    )}
                    {items.map((t, i) => (
                      <tr
                        key={t.id || `${t.nombre}-${t.fechaInicio}-${i}`}
                        className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                      >
                        <td className="px-6 py-4 border-t border-slate-200">{t.nombre ?? "—"}</td>
                        <td className="px-6 py-4 border-t border-slate-200">{t.fechaInicio ?? "—"}</td>
                        <td className="px-6 py-4 border-t border-slate-200">{t.fechaFin ?? "—"}</td>
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
