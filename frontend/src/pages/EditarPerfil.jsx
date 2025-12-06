import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import NavbarBlanco from "../components/NavbarBlanco.jsx";

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

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuario/${user.uid}`,
        {
          credentials: "include",
        }
      );
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
        whatsapp:
          typeof p.whatsapp !== "undefined" ? p.whatsapp : prev.whatsapp,
        tipos: {
          noticias: p.tipos ? !!p.tipos.noticias : prev.tipos.noticias,
          campeonatos: p.tipos
            ? !!p.tipos.campeonatos
            : prev.tipos.campeonatos,
          solicitudes: p.tipos
            ? !!p.tipos.solicitudes
            : prev.tipos.solicitudes,
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

  useEffect(() => {
    if (!user) {
      setLoadingUser(false);
      return;
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefToggle = (field) => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTipoToggle = (tipo) => {
    setPrefs((prev) => ({
      ...prev,
      tipos: { ...prev.tipos, [tipo]: !prev.tipos[tipo] },
    }));
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
      if (form.password && form.password.trim()) {
        payload.password = form.password;
      }

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuario/${user.uid}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error actualizando usuario: ${res.status}`);
      }

      setSuccess("Perfil actualizado correctamente");
      fetchUser();
    } catch (err) {
      console.error("update error:", err);
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-6 h-6 border-4 rounded-full border-primary border-t-transparent"></div>
          <p className="mt-3 text-sm">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No autenticado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavbarBlanco />
      {/* similar spacing to Perfil card */}
      <div className="max-w-3xl w-full mx-auto px-3 pt-24 pb-10">
        <div className="card bg-white shadow-md border rounded-lg">
          <div className="card-body p-4">
            <h2 className="text-xl font-semibold mb-3">Editar perfil</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* GRID: DATOS (left) / PREFERENCIAS (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DATOS */}
                <div className="p-3 bg-white rounded-md border">
                  <h3 className="text-sm font-semibold mb-2">Datos</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs mb-1">Nombre</label>
                      <input
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className="input input-bordered input-sm w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Apellido</label>
                      <input
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        className="input input-bordered input-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className="input input-bordered input-sm w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">
                        Contraseña (opcional)
                      </label>
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="input input-bordered input-sm w-full"
                        placeholder="Dejar vacío para no cambiar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Estado</label>
                      <select
                        name="estado"
                        value={form.estado}
                        onChange={handleChange}
                        className="select select-bordered select-sm w-full"
                      >
                        <option value="activo">activo</option>
                        <option value="inactivo">inactivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Nacimiento</label>
                      <input
                        name="nacimiento"
                        type="date"
                        value={form.nacimiento || ""}
                        onChange={handleChange}
                        className="input input-bordered input-sm w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* PREFERENCIAS */}
                <div className="p-3 bg-white rounded-md border">
                  <h3 className="text-sm font-semibold mb-2">Preferencias</h3>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium">
                        Notificaciones por email
                      </p>
                      <p className="text-[10px] opacity-70">
                        Recibir notificaciones vía correo electrónico
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.mail}
                      onChange={() => handlePrefToggle("mail")}
                      className="toggle toggle-sm"
                      style={{ backgroundColor: "var(--primario)" }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-medium">
                        Notificaciones por WhatsApp
                      </p>
                      <p className="text-[10px] opacity-70">
                        Recibir notificaciones vía WhatsApp
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.whatsapp}
                      onChange={() => handlePrefToggle("whatsapp")}
                      className="toggle toggle-sm"
                      style={{ backgroundColor: "var(--primario)" }}
                    />
                  </div>

                  <div className="mb-2">
                    <p className="text-xs font-medium mb-1">
                      Tipos de notificaciones
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      <label className="label cursor-pointer p-0 gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={prefs.tipos.noticias}
                          onChange={() => handleTipoToggle("noticias")}
                        />
                        <span className="label-text text-xs">Noticias</span>
                      </label>

                      <label className="label cursor-pointer p-0 gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={prefs.tipos.campeonatos}
                          onChange={() => handleTipoToggle("campeonatos")}
                        />
                        <span className="label-text text-xs">
                          Nuevos campeonatos
                        </span>
                      </label>

                      <label className="label cursor-pointer p-0 gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={prefs.tipos.solicitudes}
                          onChange={() => handleTipoToggle("solicitudes")}
                        />
                        <span className="label-text text-xs">
                          Solicitudes de partidos
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-1">
                    <p className="text-xs font-medium mb-1">Tema</p>
                    <select
                      value={prefs.tema}
                      onChange={handleTemaChange}
                      className="select select-bordered select-sm w-full max-w-xs"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BOTONES + MENSAJES */}
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      fontSize: "12px",
                      color: "white",
                      backgroundColor: "var(--neutro)",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/perfil")}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "6px 14px",
                      fontSize: "12px",
                      color: "white",
                      backgroundColor: "var(--primario)",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                    disabled={saving}
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>

                {error && (
                  <div className="mt-1 alert alert-error w-full py-2 text-xs">
                    <div>{error}</div>
                  </div>
                )}
                {success && (
                  <div className="mt-1 alert alert-success w-full py-2 text-xs">
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
