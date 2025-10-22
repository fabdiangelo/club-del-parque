import React, { useState, useEffect } from 'react';

export default function EditUserModal({ open, usuario, onCancel, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    estado: 'activo',
    nacimiento: '',
    genero: '',
    rol: 'usuario',
  });

  // --- NUEVO: categorías federado ---
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsError, setCatsError] = useState('');

  const [prefs, setPrefs] = useState({
    mail: true,
    whatsapp: false,
    tipos: { noticias: true, campeonatos: false, solicitudes: true },
    tema: 'light',
  });

  useEffect(() => {
    if (!usuario) return;
    setForm({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || usuario.mail || '',
      password: '',
      estado: usuario.estado || 'activo',
      nacimiento: usuario.nacimiento || '',
      genero: usuario.genero || '',
      rol: usuario.rol || 'usuario',
    });
    // inicializa categoría local si viene del backend
    setCategoriaId(usuario?.categoriaId ?? null);
    setPrefs((p) => ({ ...p, ...(usuario.preferencias || {}) }));
  }, [usuario]);

  // cargar categorías cuando se abre el modal y (a) hay usuario y (b) es federado (o cambia a federado)
  useEffect(() => {
    if (!open) return;
    if (!usuario) return;

    // si el usuario actual o el form marcan rol federado, cargo categorías
    if (form.rol === 'federado') {
      (async () => {
        try {
          setCatsLoading(true);
          setCatsError('');
          const res = await fetch('/api/categorias', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
          const data = await res.json();
          const sorted = (Array.isArray(data) ? data : [])
            .map((c) => ({ ...c, orden: Number(c?.orden ?? 0) }))
            .sort((a, b) => a.orden - b.orden || (a?.nombre || '').localeCompare(b?.nombre || ''));
          setCategorias(sorted);
        } catch (e) {
          setCatsError(String(e?.message || e));
        } finally {
          setCatsLoading(false);
        }
      })();
    }
  }, [open, usuario, form.rol]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefToggle = (field) => setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  const handleTipoToggle = (tipo) => setPrefs((prev) => ({ ...prev, tipos: { ...prev.tipos, [tipo]: !prev.tipos[tipo] } }));
  const handleTemaChange = (e) => setPrefs((prev) => ({ ...prev, tema: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form, preferencias: prefs };
    if (!payload.password) delete payload.password;

    // 1) guardar datos de usuario
    await onSave(payload); // parent ya maneja loading/errores

    // 2) si es federado, persistir categoría (puede ser null para quitar)
    if (form.rol === 'federado' && usuario?.id) {
      try {
        await fetch(`/api/federados/${encodeURIComponent(usuario.id)}/categoria`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoriaId: categoriaId ?? null }),
        });
        // no hace falta hacer nada más aquí: el parent refresca lista al cerrar o puedes
        // opcionalmente levantar un toast si usan uno.
      } catch (err) {
        console.error('Error guardando categoría federado:', err);
      }
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg">Editar usuario</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input input-bordered w-full" required />
          </div>
          <div>
            <label className="block text-sm">Apellido</label>
            <input name="apellido" value={form.apellido} onChange={handleChange} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input input-bordered w-full" required />
          </div>
          <div>
            <label className="block text-sm">Contraseña (dejar en blanco para no cambiar)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="select select-bordered w-full">
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Nacimiento</label>
            <input name="nacimiento" type="date" value={form.nacimiento || ''} onChange={handleChange} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm">Genero</label>
            <input name="genero" value={form.genero} onChange={handleChange} className="input input-bordered w-full" />
          </div>
          <div>
            <label className="block text-sm">Rol</label>
            <select
              name="rol"
              value={form.rol}
              onChange={(e) => {
                const newRol = e.target.value;
                setForm((prev) => ({ ...prev, rol: newRol }));
                // si pasa a no-federado, limpia la categoría seleccionada
                if (newRol !== 'federado') setCategoriaId(null);
              }}
              className="select select-bordered w-full"
            >
              <option value="usuario">usuario</option>
              <option value="federado">federado</option>
              <option value="administrador">administrador</option>
            </select>
          </div>

          {/* --- NUEVO: Categoría para federados --- */}
          {form.rol === 'federado' && (
            <div className="md:col-span-2">
              <label className="block text-sm">Categoría (federado)</label>
              <div className="flex gap-2 items-center">
                <select
                  className="select select-bordered w-full max-w-md"
                  value={categoriaId ?? ''}
                  onChange={(e) => setCategoriaId(e.target.value === '' ? null : e.target.value)}
                  disabled={catsLoading}
                >
                  <option value="">— Sin categoría —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}{typeof c.capacidad !== 'undefined' ? ` (cap: ${c.capacidad})` : ''}
                    </option>
                  ))}
                </select>
                {catsLoading && <span className="text-xs opacity-70">Cargando categorías…</span>}
                {catsError && <span className="text-xs text-red-500">{catsError}</span>}
              </div>
              <p className="text-xs opacity-70 mt-1">
                Tip: elegí “Sin categoría” para quitar la categoría del federado.
              </p>
            </div>
          )}

          {/* Preferencias */}
          <div className="md:col-span-2">
            <h4 className="font-medium">Preferencias</h4>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-sm font-medium">Notificaciones por email</p>
                <p className="text-xs opacity-70">Recibir notificaciones vía correo electrónico</p>
              </div>
              <input type="checkbox" checked={prefs.mail} onChange={() => handlePrefToggle('mail')} className="toggle toggle-primary" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-sm font-medium">Notificaciones por WhatsApp</p>
                <p className="text-xs opacity-70">Recibir notificaciones vía WhatsApp</p>
              </div>
              <input type="checkbox" checked={prefs.whatsapp} onChange={() => handlePrefToggle('whatsapp')} className="toggle toggle-secondary" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium">Tipos de notificaciones</p>
              <label className="label cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-primary mr-2" checked={prefs.tipos.noticias} onChange={() => handleTipoToggle('noticias')} />
                <span className="label-text">Noticias</span>
              </label>
              <label className="label cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-primary mr-2" checked={prefs.tipos.campeonatos} onChange={() => handleTipoToggle('campeonatos')} />
                <span className="label-text">Nuevos campeonatos</span>
              </label>
              <label className="label cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-primary mr-2" checked={prefs.tipos.solicitudes} onChange={() => handleTipoToggle('solicitudes')} />
                <span className="label-text">Solicitudes de partidos</span>
              </label>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium">Tema</p>
              <label className="inline-flex items-center mr-4">
                <input type="radio" name="tema" value="light" checked={prefs.tema === 'light'} onChange={handleTemaChange} className="radio radio-primary mr-2" />
                <span>Claro</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="tema" value="dark" checked={prefs.tema === 'dark'} onChange={handleTemaChange} className="radio radio-primary mr-2" />
                <span>Oscuro</span>
              </label>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>Cerrar</button>
      </form>
    </dialog>
  );
}
