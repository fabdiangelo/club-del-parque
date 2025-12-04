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
    setPrefs((p) => ({ ...p, ...(usuario.preferencias || {}) }));
  }, [usuario]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefToggle = (field) => setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  const handleTipoToggle = (tipo) => setPrefs((prev) => ({ ...prev, tipos: { ...prev.tipos, [tipo]: !prev.tipos[tipo] } }));
  const handleTemaChange = (e) => setPrefs((prev) => ({ ...prev, tema: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, preferencias: prefs };
    if (!payload.password) delete payload.password;
    onSave(payload);
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
            <select name="rol" value={form.rol} onChange={handleChange} className="select select-bordered w-full">
              <option value="usuario">usuario</option>
              <option value="federado">federado</option>
              <option value="administrador">administrador</option>
            </select>
          </div>

          {/* Preferencias section */}
          {/* <div className="md:col-span-2">
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
          </div> */}
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>Cerrar</button>
      </form>
    </dialog>
  );
}
