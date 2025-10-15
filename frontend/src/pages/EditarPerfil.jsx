import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from '../components/NavbarBlanco.jsx';

export default function EditarPerfil() {
  const { user, loading } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    estado: "activo",
    nacimiento: "",
    genero: "",
    rol: "usuario",
  });

  const [prefs, setPrefs] = useState({
    mail: true,
    whatsapp: false,
    tipos: {
      noticias: true,
      campeonatos: false,
      solicitudes: true,
    },
    tema: "light",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res = await fetch(`/api/usuario/${user.uid}`, {
          credentials: "include",
        });
        if (res.status === 204 || res.status === 401) {
          setLoadingUser(false);
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Unexpected /usuario response: ${res.status} ${txt}`);
        }
        const data = await res.json();
        console.log("fetched user data:", data);

        setForm((prev) => ({
          ...prev,
          nombre: data.nombre || user.nombre || "",
          apellido: data.apellido || "",
          email: data.email || user.email || "",
          estado: data.estado || "activo",
          nacimiento: data.nacimiento || "",
          genero: data.genero || "",
          rol: data.rol || "usuario",
        }));

        const p = data?.preferencias || prefs || {};
        setPrefs((prev) => ({
          ...prev,
          mail: typeof p.mail !== "undefined" ? p.mail : prev.mail,
          whatsapp: typeof p.whatsapp !== "undefined" ? p.whatsapp : prev.whatsapp,
          tipos: {
            noticias: p.tipos ? !!p.tipos.noticias : prev.tipos.noticias,
            campeonatos: p.tipos ? !!p.tipos.campeonatos : prev.tipos.campeonatos,
            solicitudes: p.tipos ? !!p.tipos.solicitudes : prev.tipos.solicitudes,
          },
          tema: p.tema || prev.tema,
        }));

        setLoadingUser(false);
      } catch (err) {
        console.error("fetchUser error:", err);
        setError(err.message || String(err));
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefToggle = (field) => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTipoToggle = (tipo) => {
    setPrefs((prev) => ({ ...prev, tipos: { ...prev.tipos, [tipo]: !prev.tipos[tipo] } }));
  };

  const handleTemaChange = (e) => {
    setPrefs((prev) => ({ ...prev, tema: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        estado: form.estado,
        nacimiento: form.nacimiento,
        genero: form.genero,
        preferencias: prefs,
        rol: form.rol,
      };
      // only send password if provided
      if (form.password && form.password.trim()) payload.password = form.password;

      const res = await fetch(`/api/usuario/${user.uid}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error actualizando usuario: ${res.status}`);
      }

      setSuccess("Perfil actualizado correctamente");
      // optional: navigate back to perfil after short delay
      setTimeout(() => navigate("/perfil"), 900);
    } catch (err) {
      console.error("update error:", err);
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (<div className="min-h-screen flex items-center justify-center"> <p>No autenticado</p> </div>);
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4" style={{ paddingTop: "6rem" }}>
      <NavbarBlanco />
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-2xl font-semibold mb-4">Editar perfil</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos */}
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-3">Datos</h3>
                <div className="space-y-3">
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
                    <input name="nacimiento" type="date" value={form.nacimiento || ""} onChange={handleChange} className="input input-bordered w-full" />
                  </div>

                  <div>
                    <label className="block text-sm">Genero</label>
                    <input name="genero" value={form.genero} onChange={handleChange} className="input input-bordered w-full" />
                  </div>
                </div>
              </div>

              {/* Preferencias */}
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-3">Preferencias</h3>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Notificaciones por email</p>
                    <p className="text-xs opacity-70">Recibir notificaciones vía correo electrónico</p>
                  </div>
                  <input type="checkbox" checked={prefs.mail} onChange={() => handlePrefToggle('mail')} className="toggle toggle-primary" />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Notificaciones por WhatsApp</p>
                    <p className="text-xs opacity-70">Recibir notificaciones vía WhatsApp</p>
                  </div>
                  <input type="checkbox" checked={prefs.whatsapp} onChange={() => handlePrefToggle('whatsapp')} className="toggle toggle-secondary" />
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium">Tipos de notificaciones</p>
                  <div className="flex flex-col gap-2 mt-2">
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
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium">Tema</p>
                  <div className="mt-2">
                    <label className="inline-flex items-center mr-4">
                      <input type="radio" name="tema" value="light" checked={prefs.tema === 'light'} onChange={handleTemaChange} className="radio radio-primary mr-2" />
                      <span>Claro</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="tema" value="dark" checked={prefs.tema === 'dark'} onChange={handleTemaChange} className="radio radio-primary mr-2" />
                      <span>Oscuro</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <button type="button" className="btn btn-ghost" onClick={() => navigate('/perfil')} disabled={saving}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>

                {error && (
                  <div className="mt-3 alert alert-error">
                    <div>{error}</div>
                  </div>
                )}
                {success && (
                  <div className="mt-3 alert alert-success">
                    <div>{success}</div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
