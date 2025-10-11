import { useMemo, useState } from "react";
import useTemporadas from "../hooks/useTemporadas";
import Navbar from "../components/Navbar";
import { AlertTriangle, CalendarPlus, Check, X } from "lucide-react";
import bgImg from "../assets/RankingsBackground.png";

const NAVBAR_OFFSET_REM = 5;

function ConfirmDialog({ open, onCancel, onConfirm, form }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-[min(92vw,640px)] rounded-2xl border border-white/20 bg-neutral-900/90 shadow-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400" aria-hidden />
          <h2 id="confirm-title" className="text-xl font-bold">Confirmar creación de temporada</h2>
        </div>
        <p className="text-white/90 mb-4">
          <strong>⚠️ Importante:</strong> las <em>temporadas no se pueden eliminar</em>.
          Al confirmar, esta temporada quedará <strong>activa</strong> y se desactivará cualquier temporada previa.
        </p>

        <div className="text-white/90 bg-neutral-800/60 rounded-xl p-4 border border-white/10 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/70">Año:</span> <span className="font-medium">{form.anio}</span></div>
            <div><span className="text-white/70">Inicio:</span> <span className="font-medium">{form.inicio}</span></div>
            <div><span className="text-white/70">Fin:</span> <span className="font-medium">{form.fin}</span></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-white/30 bg-neutral-800/70 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
          >
            <X className="w-5 h-5" /> Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/80"
          >
            <CalendarPlus className="w-5 h-5" /> Confirmar y activar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemporadasPage() {
  const { items, activa, loading, error, create, activate } = useTemporadas();

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sixMonthsLaterISO = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  }, []);

  const [form, setForm] = useState({
    anio: new Date().getFullYear(),
    inicio: todayISO,
    fin: sixMonthsLaterISO,
  });

  const [ok, setOk] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setOk("");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    const success = await create(form);
    if (success) setOk("Temporada creada y activada");
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
              Administrar Temporadas
            </h1>
            <p className="mt-3 text-white/80">
              Creá nuevas temporadas (se activan automáticamente) y administrá el estado de las existentes.
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
                <div>
                  <label className="block text-sm mb-1 text-white/80">Año</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="number"
                    name="anio"
                    value={form.anio}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/80">Inicio</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="date"
                    name="inicio"
                    value={form.inicio}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-white/80">Fin</label>
                  <input
                    className="h-11 w-full rounded-xl border border-white/30 bg-neutral-900/80 text-white shadow-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    type="date"
                    name="fin"
                    value={form.fin}
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
                  {loading ? "Creando…" : (<><CalendarPlus className="w-5 h-5" /> Crear y activar</>)}
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
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Año</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Inicio</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Fin</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Estado</th>
                      <th className="px-6 py-4 font-semibold border-y border-white/20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-base sm:text-lg">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center border-t border-white/10 text-white/70">
                          No hay temporadas.
                        </td>
                      </tr>
                    )}
                    {items.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`transition-colors hover:bg-neutral-800/60 ${
                          i % 2 === 0 ? "bg-neutral-900/40" : "bg-transparent"
                        }`}
                      >
                        <td className="px-6 py-4 border-t border-white/10">{t.anio}</td>
                        <td className="px-6 py-4 border-t border-white/10">{t.inicio}</td>
                        <td className="px-6 py-4 border-t border-white/10">{t.fin}</td>
                        <td className="px-6 py-4 border-t border-white/10">
                          {t.estado === "activa" ? (
                            <span className="px-2 py-1 rounded bg-green-700/30 text-green-200 border border-green-500/30">
                              Activa
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-neutral-700/30 text-white/80 border border-white/20">
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-t border-white/10">
                          {t.estado !== "activa" ? (
                            <button
                              onClick={() => activate(t.id)}
                              disabled={loading}
                              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                            >
                              Activar
                            </button>
                          ) : (
                            <span className="text-sm text-white/70">Actual</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activa && (
                <div className="px-6 py-4 text-sm text-white/80 border-t border-white/10">
                  <strong>Temporada activa:</strong> {activa.anio} ({activa.inicio} → {activa.fin})
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        form={form}
      />
    </div>
  );
}
