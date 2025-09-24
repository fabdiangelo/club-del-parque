import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/club-del-parque-68530/us-central1/api";

function field(v) {
  return typeof v === "string" ? v.trim() : v ?? "";
}

export default function CrearNoticia() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    titulo: "",
    tipo: "",
    administradorID: "",
    mdContent: "",
    imagen: null,
  });

  const [edit, setEdit] = useState({
    id: "",
    nombre: "",
    titulo: "",
    tipo: "",
    administradorID: "",
    mdContent: "",
    imagen: null,
    open: false,
  });

  const fileInputRef = useRef(null);
  const replaceImageFileInputRefs = useRef({});

  /*const headersJSON = useMemo(
    () => ({
      "Content-Type": "application/json",
    }),
    []
  );*/

  const fetchNoticias = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/noticias`, { credentials: "include" });
      if (!res.ok) throw new Error(`GET /noticias ${res.status}`);
      const data = await res.json();
      setNoticias(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error listando noticias");
    } finally {
      setLoading(false);
    }
  };

  const fetchNoticiaById = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/noticias/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`GET /noticias/${id} ${res.status}`);
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      setError(e.message || "Error obteniendo la noticia");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nombre", field(form.nombre));
      fd.append("titulo", field(form.titulo));
      fd.append("tipo", field(form.tipo));
      fd.append("administradorID", field(form.administradorID));
      fd.append("mdContent", field(form.mdContent));
      if (form.imagen) fd.append("imagen", form.imagen);

      const res = await fetch(`${API_BASE}/noticias`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`POST /noticias ${res.status} ${t}`);
      }
      await fetchNoticias();
      setForm({
        nombre: "",
        titulo: "",
        tipo: "",
        administradorID: "",
        mdContent: "",
        imagen: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e.message || "Error creando noticia");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/noticias/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`DELETE /noticias/${id} ${res.status}`);
      await fetchNoticias();
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      setError(e.message || "Error eliminando noticia");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (n) => {
    setEdit({
      id: n.id,
      nombre: n.nombre || "",
      titulo: n.titulo || "",
      tipo: n.tipo || "",
      administradorID: n.administradorID || "",
      mdContent: n.mdContent || "",
      imagen: null,
      open: true,
    });
  };

  const closeEdit = () =>
    setEdit((s) => ({ ...s, open: false, imagen: null }));

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!edit.id) return;

    setBusyId(edit.id);
    setError("");

    try {
      const fd = new FormData();
      fd.append("nombre", field(edit.nombre));
      fd.append("titulo", field(edit.titulo));
      fd.append("tipo", field(edit.tipo));
      fd.append("administradorID", field(edit.administradorID));
      fd.append("mdContent", field(edit.mdContent));
      if (edit.imagen) fd.append("imagen", edit.imagen);

      const res = await fetch(`${API_BASE}/noticias/${edit.id}`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`PUT /noticias/${edit.id} ${res.status} ${t}`);
      }

      await fetchNoticias();
      if (selected?.id === edit.id) await fetchNoticiaById(edit.id);
      closeEdit();
    } catch (e2) {
      setError(e2.message || "Error actualizando noticia");
    } finally {
      setBusyId(null);
    }
  };

  const onReplaceImage = async (id, file) => {
    if (!file) return;
    setBusyId(id);
    setError("");
    try {
      const fd = new FormData();
      fd.append("imagen", file);
      const res = await fetch(`${API_BASE}/noticias/${id}/imagen`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`POST /noticias/${id}/imagen ${res.status}`);
      await fetchNoticias();
      if (selected?.id === id) await fetchNoticiaById(id);
    } catch (e) {
      setError(e.message || "Error reemplazando imagen");
    } finally {
      setBusyId(null);
    }
  };

  const onRemoveImage = async (id) => {
    if (!confirm("¿Quitar imagen de esta noticia?")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/noticias/${id}/imagen`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`DELETE /noticias/${id}/imagen ${res.status}`);
      await fetchNoticias();
      if (selected?.id === id) await fetchNoticiaById(id);
    } catch (e) {
      setError(e.message || "Error eliminando imagen");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-900 text-white">
      <Navbar />
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-24 space-y-12">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold">Panel de Noticias (demo)</h1>
          <Link
            to="/noticias"
            className="rounded-full bg-sky-400 px-5 py-2 font-semibold text-white hover:bg-sky-500"
          >
            Ver lista pública
          </Link>
        </header>

        {error && (
          <div className="rounded-xl bg-red-600/20 border border-red-500/40 p-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* CREATE */}
        <section className="rounded-3xl bg-neutral-800 border border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-4">Crear Noticia</h2>
          <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-4">
            <TextInput
              label="Nombre"
              value={form.nombre}
              onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
            />
            <TextInput
              label="Título"
              value={form.titulo}
              onChange={(v) => setForm((s) => ({ ...s, titulo: v }))}
            />
            <TextInput
              label="Tipo"
              value={form.tipo}
              onChange={(v) => setForm((s) => ({ ...s, tipo: v }))}
            />
            <TextInput
              label="Administrador ID"
              value={form.administradorID}
              onChange={(v) => setForm((s) => ({ ...s, administradorID: v }))}
            />
            <div className="md:col-span-2">
              <Label>Contenido (Markdown)</Label>
              <textarea
                className="w-full mt-2 rounded-xl bg-neutral-700 border border-white/10 p-3"
                rows={6}
                value={form.mdContent}
                onChange={(e) =>
                  setForm((s) => ({ ...s, mdContent: e.target.value }))
                }
                placeholder="Escribe el contenido en Markdown…"
              />
            </div>
            <div>
              <Label>Imagen</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={(e) =>
                  setForm((s) => ({ ...s, imagen: e.target.files?.[0] || null }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-500 hover:bg-sky-600 px-5 py-3 font-semibold disabled:opacity-60"
              >
                {loading ? "Creando…" : "Crear Noticia"}
              </button>
            </div>
          </form>
        </section>

        {/* LIST */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Noticias</h2>
            <button
              onClick={fetchNoticias}
              className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10"
            >
              Recargar
            </button>
          </div>

          {loading ? (
            <p className="text-neutral-300">Cargando…</p>
          ) : noticias.length === 0 ? (
            <p className="text-neutral-300">No hay noticias aún.</p>
          ) : (
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n) => (
                <li key={n.id} className="rounded-2xl bg-neutral-800 border border-white/10 overflow-hidden">
                  {n.imagenUrl ? (
                    <img
                      src={n.imagenUrl}
                      alt={n.titulo}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-neutral-700 grid place-items-center text-neutral-400 text-sm">
                      Sin imagen
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <h3 className="text-lg font-bold">{n.titulo || "—"}</h3>
                    <p className="text-sm text-neutral-300">{n.nombre || "—"}</p>
                    <p className="text-xs text-neutral-400">
                      {fmtDate(n.fechaCreacion)} · {n.tipo || "—"}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-3">
                      <button
                        onClick={() => fetchNoticiaById(n.id)}
                        disabled={busyId === n.id}
                        className="rounded-lg bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-60"
                      >
                        {busyId === n.id ? "Abriendo…" : "Ver"}
                      </button>
                      <button
                        onClick={() => openEdit(n)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm hover:bg-sky-700"
                      >
                        Editar
                      </button>
                      <label className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm hover:bg-amber-700 cursor-pointer">
                        Reemplazar imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) =>
                            (replaceImageFileInputRefs.current[n.id] = el)
                          }
                          onChange={(e) =>
                            onReplaceImage(n.id, e.target.files?.[0] || null)
                          }
                        />
                      </label>
                      <button
                        onClick={() => onRemoveImage(n.id)}
                        disabled={busyId === n.id}
                        className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm hover:bg-orange-800 disabled:opacity-60"
                      >
                        Quitar imagen
                      </button>
                      <button
                        onClick={() => onDelete(n.id)}
                        disabled={busyId === n.id}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm hover:bg-red-700 disabled:opacity-60"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* DETAIL */}
        <section className="rounded-3xl bg-neutral-800 border border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-4">Detalle</h2>
          {!selected ? (
            <p className="text-neutral-400">Elige “Ver” en una noticia.</p>
          ) : (
            <article className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold">{selected.titulo}</h3>
                <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">
                  {selected.tipo || "—"}
                </span>
              </div>
              <p className="text-sm text-neutral-300">
                Por <strong>{selected.nombre || "—"}</strong> ·{" "}
                {fmtDate(selected.fechaCreacion)} (actualizado{" "}
                {fmtDate(selected.fechaActualizacion)})
              </p>
              {selected.imagenUrl && (
                <img
                  className="w-full max-h-96 object-cover rounded-xl border border-white/10"
                  src={selected.imagenUrl}
                  alt={selected.titulo}
                />
              )}
              <pre className="whitespace-pre-wrap bg-neutral-900/60 rounded-xl p-4 border border-white/10 text-neutral-200 text-sm">
                {selected.mdContent || "*Sin contenido*"}
              </pre>
            </article>
          )}
        </section>
      </main>

      {/* EDIT MODAL */}
      {edit.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-neutral-900 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Editar Noticia</h3>
              <button
                onClick={closeEdit}
                className="rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={onUpdate} className="grid md:grid-cols-2 gap-4">
              <TextInput
                label="Nombre"
                value={edit.nombre}
                onChange={(v) => setEdit((s) => ({ ...s, nombre: v }))}
              />
              <TextInput
                label="Título"
                value={edit.titulo}
                onChange={(v) => setEdit((s) => ({ ...s, titulo: v }))}
              />
              <TextInput
                label="Tipo"
                value={edit.tipo}
                onChange={(v) => setEdit((s) => ({ ...s, tipo: v }))}
              />
              <TextInput
                label="Administrador ID"
                value={edit.administradorID}
                onChange={(v) => setEdit((s) => ({ ...s, administradorID: v }))}
              />
              <div className="md:col-span-2">
                <Label>Contenido (Markdown)</Label>
                <textarea
                  className="w-full mt-2 rounded-xl bg-neutral-800 border border-white/10 p-3"
                  rows={6}
                  value={edit.mdContent}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, mdContent: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Nueva imagen (opcional)</Label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm"
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, imagen: e.target.files?.[0] || null }))
                  }
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={busyId === edit.id}
                  className="rounded-xl bg-sky-500 hover:bg-sky-600 px-5 py-3 font-semibold disabled:opacity-60"
                >
                  {busyId === edit.id ? "Guardando…" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl border border-white/20 px-5 py-3 hover:bg-white/10"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */
function Label({ children }) {
  return <label className="text-sm text-neutral-300">{children}</label>;
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        className="mt-2 w-full rounded-xl bg-neutral-700 border border-white/10 p-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
      />
    </div>
  );
}

/* ---------- helpers ---------- */
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
