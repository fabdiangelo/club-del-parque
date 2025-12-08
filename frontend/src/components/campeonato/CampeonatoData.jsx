import { Trophy, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CampeonatoData({
  id = '',
  nombre = '',
  descripcion = '',
  inicio = '01-01-2000',
  fin = '01-01-2000',
  requisitosParticipacion = {},
  user = {},
  participantes = [],
  onRefresh,
  conRedireccion = false,
  dobles = false,
}) {
  const [procesando, setProcesando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAdminOpen, setModalAdminOpen] = useState(false);
  const [inscripto, setInscripto] = useState(false);

  const [form, setForm] = useState({
    nombre,
    descripcion,
    inicio,
  });

  const [inviteeUid, setInviteeUid] = useState('');

  const [display, setDisplay] = useState({
    nombre,
    descripcion,
    inicio,
    fin,
  });

  const [reglamentoUrl, setReglamentoUrl] = useState(null);

  function diasEntreFechas(fecha1, fecha2) {
    const f1 = new Date(fecha1);
    const f2 = new Date(fecha2);

    if (isNaN(f1.getTime()) || isNaN(f2.getTime())) return 0;

    const diferenciaMs = Math.abs(f2 - f1);
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    return dias;
  }

  const cantDias = diasEntreFechas(display.inicio, display.fin);

  useEffect(() => {
    setForm({
      nombre,
      descripcion,
      inicio,
    });
    setDisplay({
      nombre,
      descripcion,
      inicio,
      fin,
    });
  }, [id, nombre, descripcion, inicio, fin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleInscripcion() {
    try {
      setProcesando(true);

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/federado-campeonato/${id}/${user.uid}`;
      const opts = {
        method: 'POST',
        credentials: 'include',
      };

      if (inviteeUid && inviteeUid.trim().length > 0) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify({ inviteeUid: inviteeUid.trim() });
      }

      const res = await fetch(url, opts);
      if (res.ok) {
        setInscripto(true);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.log(e);
    } finally {
      setProcesando(false);
    }
  }

  const handleEditar = async (e) => {
    e.preventDefault();
    setProcesando(true);

    try {
      const inicioDate = new Date(form.inicio);
      const finDate = new Date(
        inicioDate.getTime() + cantDias * 24 * 60 * 60 * 1000
      );
      const dateFin = finDate.toISOString();

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        inicio: form.inicio,
        fin: dateFin,
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/campeonato/${id}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error actualizando campeonato: ${res.status}`);
      }

      setDisplay({
        nombre: form.nombre,
        descripcion: form.descripcion,
        inicio: form.inicio,
        fin: dateFin,
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('update error:', err);
    } finally {
      setProcesando(false);
      setModalAdminOpen(false);
    }
  };

  function renderCondicion(label, value) {
    if (value === null || value === undefined) {
      return (
        <div className="flex justify-between py-1">
          <span className="text-sm text-gray-700">{label}</span>
          <span className="text-sm text-gray-400">No aplica</span>
        </div>
      );
    }

    return (
      <div className="flex justify-between py-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{String(value)}</span>
      </div>
    );
  }

  const yaInscripto =
    user?.rol === 'federado' &&
    (participantes
      .map((part) => part.split('federado-')[1]?.split('-')[0])
      .includes(user.uid) ||
      participantes.includes(user.uid) ||
      inscripto);

  const inscripcionAbierta = new Date(display.inicio) >= new Date();

  return (
    <section className="mb-6">
      <article className="relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-5 md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-40 w-40 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
              <Trophy className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-gray-800 uppercase">
                {display.nombre}
              </h1>
            </div>
          </div>

          {user?.rol === 'federado' && (
            <div className="flex flex-col items-end gap-1">
              {yaInscripto && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                  Inscripto
                </span>
              )}
              {!yaInscripto && !inscripcionAbierta && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200">
                  Inscripción cerrada
                </span>
              )}
            </div>
          )}
        </div>

        {/* Descripción */}
        {display.descripcion && (
          <p className="text-xs md:text-sm text-gray-600 mb-4 whitespace-pre-line">
            {display.descripcion}
          </p>
        )}

        {/* Fechas */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs text-gray-600 border border-slate-100">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(display.inicio).toLocaleDateString()} –{' '}
              {new Date(display.fin).toLocaleDateString()}
            </span>
          </div>

          {participantes && participantes.length > 0 && (
            <span className="text-xs text-gray-500">
              {participantes.length} usuario
              {participantes.length !== 1 && 's'} inscripto
              {participantes.length !== 1 && 's'}
            </span>
          )}
        </div>

        {/* Reglamento */}
        {reglamentoUrl && (
          <div className="mt-2 mb-4">
            <button
              className="btn btn-sm btn-outline normal-case text-xs"
              onClick={async () => {
                try {
                  if (reglamentoUrl) {
                    window.open(reglamentoUrl, '_blank');
                    return;
                  }
                  const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/campeonato/${id}`,
                    { credentials: 'include' }
                  );
                  if (!res.ok)
                    return alert(
                      'No se pudo obtener información del campeonato'
                    );
                  const data = await res.json();
                  const url = data?.reglamentoUrl || data?.reglamentoURL || null;
                  if (!url)
                    return alert(
                      'No hay reglamento disponible para este campeonato'
                    );
                  setReglamentoUrl(url);
                  window.open(url, '_blank');
                } catch (e) {
                  console.error(e);
                  alert('Error obteniendo reglamento');
                }
              }}
            >
              Ver reglamento (PDF)
            </button>
          </div>
        )}

        {/* Federado / inscripción */}
        {user?.rol === 'federado' && inscripcionAbierta && !yaInscripto && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs text-gray-500 mb-1">
              {participantes.length} usuario
              {participantes.length !== 1 && 's'} inscripto
              {participantes.length !== 1 && 's'}
            </p>

            {dobles && (
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-700">
                  Invitar a (UID) – opcional
                </label>
                <input
                  value={inviteeUid}
                  onChange={(e) => setInviteeUid(e.target.value)}
                  placeholder="UID del invitado"
                  className="input input-bordered w-full mt-1 text-sm"
                />
              </div>
            )}

            <button
              className="btn btn-primary mt-4 w-full md:w-auto normal-case text-sm"
              onClick={handleInscripcion}
              disabled={procesando}
            >
              {procesando ? 'Inscribiendo...' : 'Inscribirme'}
            </button>

            <div className="mt-3 text-xs text-gray-500">
              <span>
                ¿No estás seguro si puedes participar en este torneo?
              </span>
              <br />
              <button
                className="mt-1 text-blue-600 hover:underline"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                Ver condiciones de participación
              </button>
            </div>
          </div>
        )}

        {user?.rol === 'federado' && !inscripcionAbierta && !yaInscripto && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <span className="text-xs text-gray-500">
              Periodo de inscripción finalizado
            </span>
          </div>
        )}

        {/* Modal condiciones */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setModalOpen(false)}
            />
            <div className="relative bg-white text-black rounded-xl shadow-2xl max-w-lg w-full p-6">
              <button
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold mb-3">
                Condiciones de participación
              </h2>
              <div className="text-sm text-gray-700 mb-4">
                <p className="mb-2">
                  A continuación se muestran los requisitos para participar en
                  este campeonato. Si un campo indica &quot;No aplica&quot;,
                  significa que no se exige esa condición.
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-md p-3 space-y-1">
                  {renderCondicion(
                    'Género',
                    requisitosParticipacion.genero ?? null
                  )}
                  {renderCondicion(
                    'Edad desde',
                    requisitosParticipacion.edadDesde ?? null
                  )}
                  {renderCondicion(
                    'Edad hasta',
                    requisitosParticipacion.edadHasta ?? null
                  )}
                  {renderCondicion(
                    'Ranking desde',
                    requisitosParticipacion.rankingDesde ?? null
                  )}
                  {renderCondicion(
                    'Ranking hasta',
                    requisitosParticipacion.rankingHasta ?? null
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin */}
        {user?.rol === 'administrador' && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              className="btn btn-info w-full md:w-auto text-white normal-case text-sm"
              onClick={() => setModalAdminOpen(true)}
              disabled={procesando}
            >
              {procesando ? 'Editando...' : 'Editar'}
            </button>
          </div>
        )}

        {modalAdminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setModalAdminOpen(false)}
            />
            <div className="relative bg-white text-black rounded-xl shadow-2xl max-w-lg w-full p-6">
              <button
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-gray-100"
                onClick={() => setModalAdminOpen(false)}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold mb-3">Editar campeonato</h2>
              <form onSubmit={handleEditar} className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="input input-bordered w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Inicio
                  </label>
                  <input
                    name="inicio"
                    type="date"
                    value={form.inicio || ''}
                    onChange={handleChange}
                    className="input input-bordered w-full text-sm"
                  />
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm normal-case"
                    onClick={() => setModalAdminOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm normal-case"
                    disabled={procesando}
                  >
                    {procesando ? 'Editando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer / Ver más */}
        <div className="mt-5 flex justify-end">
          {conRedireccion && (
            <Link
              to={`/campeonato/${id}`}
              className="btn btn-outline btn-sm md:btn-md normal-case text-sm md:text-base bg-sky-500"
            >
              Ver más
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}
