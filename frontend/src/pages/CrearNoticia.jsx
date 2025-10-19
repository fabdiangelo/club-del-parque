import React, { useEffect, useRef, useState } from "react";
import NavbarBlanco from '../components/NavbarBlanco.jsx';
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import SoloAdmin from "../components/SoloAdmin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RichTextEditor from "../components/RichTextEditor";
import rehypeRaw from "rehype-raw";

/* ---------------- CONFIG ---------------- */
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/club-del-parque-68530/us-central1/api";

/* ---------------- HELPERS ---------------- */
const field = (v) => (typeof v === "string" ? v.trim() : v ?? "");

function normalizeMarkdown(src = "") {
  if (!src) return "";

   const md = String(src).replace(/\r\n?/g, "\n");
   return md.replace(
     /([^\n])\n((?:\s*[-+*]\s+\S)|(?:\s*\d+\.\s+\S))/g,
     (_m, a, b) => `${a}\n\n${b}`
   );
 }

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const safeText = async (res) => {
  try {
    return await res.text();
  } catch {
    return "";
  }
};

/* ---------------- MAIN ---------------- */
export default function CrearNoticia() {
  const { user } = useAuth();

  const [noticias, setNoticias] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Create form
  const [form, setForm] = useState({
    nombre: "",
    titulo: "",
    tipo: "",
    mdContent: "",
    imagenes: [],
  });

  // Edit modal
  const [edit, setEdit] = useState({
    id: "",
    nombre: "",
    titulo: "",
    tipo: "",
    mdContent: "",
    imagenesNew: [],
    open: false,
  });
  const [editFullscreen, setEditFullscreen] = useState(false);

  const [editorHeight, setEditorHeight] = useState(360);
  const fileInputRef = useRef(null);
  const addImagesRefs = useRef({});

  useEffect(() => {
    const onResize = () => {
      setEditorHeight(Math.max(280, Math.min(600, Math.floor(window.innerHeight * 0.55))));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------------- API ---------------- */
  const fetchNoticias = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/noticias`);
      if (!res.ok) throw new Error(`GET /noticias ${res.status}`);
      setNoticias(await res.json());
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
      const res = await fetch(`${API_BASE}/noticias/${id}`);
      if (!res.ok) throw new Error(`GET /noticias/${id} ${res.status}`);
      setSelected(await res.json());
    } catch (e) {
      setError(e.message || "Error obteniendo noticia");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  /* ---------------- Files ---------------- */
  async function fileToBase64(file) {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function uploadImagesJson(noticiaId, files) {
    if (!files?.length) return;
    const payload = {
      images: await Promise.all(
        files.map(async (f) => ({
          filename: f.name || "image",
          contentType: f.type || "application/octet-stream",
          dataBase64: await fileToBase64(f),
        }))
      ),
    };
    const res = await fetch(`${API_BASE}/noticias/${noticiaId}/imagenes-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST /noticias/${noticiaId}/imagenes-json ${res.status} ${await safeText(res)}`);
    return res.json();
  }

  async function removeImageByPath(noticiaId, imagePath) {
    const url = new URL(`${API_BASE}/noticias/${encodeURIComponent(noticiaId)}/imagenes`);
    url.searchParams.set("imagePath", imagePath);
    const res = await fetch(url.toString(), { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE /noticias/${noticiaId}/imagenes ${res.status} ${await safeText(res)}`);
    return res.json();
  }

  /* ---------------- CRUD ---------------- */
  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        nombre: field(form.nombre),
        titulo: field(form.titulo),
        tipo: field(form.tipo),
        mdContent: normalizeMarkdown(field(form.mdContent)),
      };
      const res = await fetch(`${API_BASE}/noticias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`POST /noticias ${res.status} ${await safeText(res)}`);
      const created = await res.json();
      if (created?.id && form.imagenes?.length) await uploadImagesJson(created.id, form.imagenes);

      await fetchNoticias();
      setForm({ nombre: "", titulo: "", tipo: "", mdContent: "", imagenes: [] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e.message || "Error creando noticia");
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!edit.id) return;
    setBusyId(edit.id);
    setError("");
    try {
      const payload = {
        nombre: field(edit.nombre),
        titulo: field(edit.titulo),
        tipo: field(edit.tipo),
        mdContent: normalizeMarkdown(field(edit.mdContent)),
      };
      const res = await fetch(`${API_BASE}/noticias/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`PUT /noticias/${edit.id} ${res.status} ${await safeText(res)}`);
      if (edit.imagenesNew?.length) await uploadImagesJson(edit.id, edit.imagenesNew);

      await fetchNoticias();
      if (selected?.id === edit.id) await fetchNoticiaById(edit.id);
      closeEdit();
    } catch (e) {
      setError(e.message || "Error actualizando noticia");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/noticias/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`DELETE /noticias/${id} ${res.status}`);
      await fetchNoticias();
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      setError(e.message || "Error eliminando noticia");
    } finally {
      setBusyId(null);
    }
  };

  const onAddImagesFromList = async (id, files) => {
    if (!files?.length) return;
    setBusyId(id);
    try {
      await uploadImagesJson(id, files);
      await fetchNoticias();
      if (selected?.id === id) await fetchNoticiaById(id);
      if (addImagesRefs.current[id]) addImagesRefs.current[id].value = "";
    } catch (e) {
      setError(e.message || "Error subiendo imágenes");
    } finally {
      setBusyId(null);
    }
  };

  const onRemoveImage = async (noticiaId, imagePath) => {
    if (!confirm("¿Quitar esta imagen?")) return;
    setBusyId(noticiaId);
    try {
      await removeImageByPath(noticiaId, imagePath);
      await fetchNoticias();
      if (selected?.id === noticiaId) await fetchNoticiaById(noticiaId);
    } catch (e) {
      setError(e.message || "Error eliminando imagen");
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
      mdContent: n.mdContent || "",
      imagenesNew: [],
      open: true,
    });
    setEditFullscreen(false);
  };

  const closeEdit = () => setEdit((s) => ({ ...s, open: false, imagenesNew: [] }));

  /* ---------------- RENDER ---------------- */
  if (!user || user.rol !== "administrador") return <SoloAdmin />;

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-900 text-white">
      <NavbarBlanco />
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-24 space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold">Panel de Noticias</h1>
          <Link to="/noticias" className="rounded-full bg-sky-400 px-5 py-2 font-semibold text-white hover:bg-sky-500">
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
            <TextInput label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
            <TextInput label="Título" value={form.titulo} onChange={(v) => setForm((s) => ({ ...s, titulo: v }))} />
            <TextInput label="Tipo" value={form.tipo} onChange={(v) => setForm((s) => ({ ...s, tipo: v }))} />

            <div className="md:col-span-2">
              <Label>Contenido</Label>
              <RichTextEditor
                valueMarkdown={form.mdContent}
                onChangeMarkdown={(md) => setForm((s) => ({ ...s, mdContent: md }))}
                height={editorHeight}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Imágenes (múltiples, opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={(e) => setForm((s) => ({ ...s, imagenes: Array.from(e.target.files || []) }))}
              />
              {!!form.imagenes?.length && (
                <p className="text-xs text-neutral-400 mt-1">{form.imagenes.length} archivo(s) seleccionados.</p>
              )}
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
            <button onClick={fetchNoticias} className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10">
              Recargar
            </button>
          </div>

          {loading ? (
            <p className="text-neutral-300">Cargando…</p>
          ) : noticias.length === 0 ? (
            <p className="text-neutral-300">No hay noticias aún.</p>
          ) : (
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.map((n) => {
                const firstImg = (Array.isArray(n.imagenes) && n.imagenes[0]?.imageUrl) || n.imagenUrl || null;
                return (
                  <li key={n.id} className="rounded-2xl bg-neutral-800 border border-white/10 overflow-hidden">
                    {firstImg ? (
                      <img src={firstImg} alt={n.titulo} className="w-full h-40 object-cover" />
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

                      <div className="pt-2">
                        <label className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm hover:bg-amber-700 cursor-pointer inline-block">
                          Agregar imágenes
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={(el) => (addImagesRefs.current[n.id] = el)}
                            onChange={(e) => onAddImagesFromList(n.id, Array.from(e.target.files || []))}
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3">
                        <button
                          onClick={() => fetchNoticiaById(n.id)}
                          disabled={busyId === n.id}
                          className="rounded-lg bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-60"
                        >
                          {busyId === n.id ? "Abriendo…" : "Ver"}
                        </button>
                        <button onClick={() => openEdit(n)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm hover:bg-sky-700">
                          Editar
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
                );
              })}
            </ul>
          )}
        </section>

        {/* DETAIL */}
        <section className="rounded-3xl bg-neutral-800 border border-white/10 p-6">
          <h2 className="text-2xl font-bold mb-4">Detalle</h2>
          {!selected ? (
            <p className="text-neutral-400">Elige “Ver” en una noticia.</p>
          ) : (
            <article className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold">{selected.titulo}</h3>
                <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">{selected.tipo || "—"}</span>
              </div>
              <p className="text-sm text-neutral-300">
                Por <strong>{selected.nombre || "—"}</strong> · {fmtDate(selected.fechaCreacion)} (actualizado{" "}
                {fmtDate(selected.fechaActualizacion)})
              </p>

              {Array.isArray(selected.imagenes) && selected.imagenes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selected.imagenes.map((img, idx) => (
                    <div key={img.imagePath || idx} className="relative group">
                      <img className="w-full h-40 object-cover rounded-xl border border-white/10" src={img.imageUrl} alt={`img-${idx}`} />
                      <button
                        onClick={() => onRemoveImage(selected.id, img.imagePath)}
                        disabled={busyId === selected.id}
                        className="absolute top-2 right-2 text-xs rounded-md bg-red-600 px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : selected.imagenUrl ? (
                <img className="w-full max-h-96 object-cover rounded-xl border border-white/10" src={selected.imagenUrl} alt={selected.titulo} />
              ) : (
                <div className="w-full h-40 bg-neutral-700 grid place-items-center text-neutral-400 text-sm rounded-xl border border-white/10">
                  Sin imágenes
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {selected.mdContent || "*Sin contenido*"}
                </ReactMarkdown>
              </div>
            </article>
          )}
        </section>
      </main>

      {/* EDIT MODAL */}
      {edit.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
          <div
            className={`w-full ${editFullscreen ? "max-w-[95vw]" : "max-w-3xl"} rounded-2xl bg-neutral-900 border border-white/10 flex flex-col`}
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900/90">
              <h3 className="text-xl font-bold">Editar Noticia</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditFullscreen((v) => !v)} className="rounded-lg px-3 py-1.5 hover:bg-white/10 text-sm">
                  {editFullscreen ? "Ventana" : "Pantalla completa"}
                </button>
                <button onClick={closeEdit} className="rounded-lg px-3 py-1.5 hover:bg-white/10">
                  Cerrar
                </button>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <form onSubmit={onUpdate} className="grid md:grid-cols-2 gap-4">
                <TextInput label="Nombre" value={edit.nombre} onChange={(v) => setEdit((s) => ({ ...s, nombre: v }))} />
                <TextInput label="Título" value={edit.titulo} onChange={(v) => setEdit((s) => ({ ...s, titulo: v }))} />
                <TextInput label="Tipo" value={edit.tipo} onChange={(v) => setEdit((s) => ({ ...s, tipo: v }))} />

                <div className="md:col-span-2">
                  <Label>Contenido</Label>
                  <RichTextEditor
                    valueMarkdown={edit.mdContent}
                    onChangeMarkdown={(md) => setEdit((s) => ({ ...s, mdContent: md }))}
                    height={editFullscreen ? Math.max(500, window.innerHeight * 0.6) : editorHeight}
                    placeholder="Edita el contenido…"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Agregar nuevas imágenes</Label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-2 block w-full text-sm"
                    onChange={(e) => setEdit((s) => ({ ...s, imagenesNew: Array.from(e.target.files || []) }))}
                  />
                  {!!edit.imagenesNew?.length && (
                    <p className="text-xs text-neutral-400 mt-1">{edit.imagenesNew.length} archivo(s) para subir al guardar.</p>
                  )}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-white/10 sticky bottom-0 bg-neutral-900/90 flex gap-3">
              <button
                onClick={onUpdate}
                disabled={busyId === edit.id}
                className="rounded-xl bg-sky-500 hover:bg-sky-600 px-5 py-3 font-semibold disabled:opacity-60"
              >
                {busyId === edit.id ? "Guardando…" : "Guardar cambios"}
              </button>
              <button type="button" onClick={closeEdit} className="rounded-xl border border-white/20 px-5 py-3 hover:bg-white/10">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI BITS ---------- */
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
