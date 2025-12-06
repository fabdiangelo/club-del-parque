import React, { useEffect, useRef, useState } from "react";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import SoloAdmin from "../components/SoloAdmin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RichTextEditor from "../components/RichTextEditor";
import rehypeRaw from "rehype-raw";

/* ---------------- CONFIG ---------------- */
const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:5001/club-del-parque-8ec2a/us-central1/api";

const PAGE_SIZE = 6;

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
  const [listOpen, setListOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
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

  // Combobox opciones de tipo (usa tipos existentes + lo que esté escrito)
  const tiposExistentes = React.useMemo(() => {
    const set = new Set();
    noticias.forEach((n) => {
      const t = field(n.tipo);
      if (t) set.add(t);
    });
    if (form.tipo) set.add(field(form.tipo));
    if (edit.tipo) set.add(field(edit.tipo));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [noticias, form.tipo, edit.tipo]);

  const [editorHeight, setEditorHeight] = useState(360);
  const fileInputRef = useRef(null);
  const addImagesRefs = useRef({});

  useEffect(() => {
    const onResize = () => {
      setEditorHeight(
        Math.max(280, Math.min(600, Math.floor(window.innerHeight * 0.55)))
      );
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchNoticias = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/noticias`
      );
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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/noticias/${id}`
      );
      if (!res.ok) throw new Error(`GET /noticias/${id} ${res.status}`);
      const data = await res.json();
      setSelected(data);
      setDetailOpen(true);
    } catch (e) {
      setError(e.message || "Error obteniendo noticia");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  // Si cambia el número de noticias, volvemos a página 1
  useEffect(() => {
    setPage(1);
  }, [noticias.length]);

  /* ---------------- Files ---------------- */
  async function fileToBase64(file) {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunkSize)
      );
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
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/noticias/${noticiaId}/imagenes-json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok)
      throw new Error(
        `POST /noticias/${noticiaId}/imagenes-json ${res.status} ${await safeText(
          res
        )}`
      );
    return res.json();
  }

  async function removeImageByPath(noticiaId, imagePath) {
    const url = new URL(
      `${import.meta.env.VITE_BACKEND_URL}/api/noticias/${encodeURIComponent(
        noticiaId
      )}/imagenes`
    );
    url.searchParams.set("imagePath", imagePath);
    const res = await fetch(url.toString(), { method: "DELETE" });
    if (!res.ok)
      throw new Error(
        `DELETE /noticias/${noticiaId}/imagenes ${res.status} ${await safeText(
          res
        )}`
      );
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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/noticias`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok)
        throw new Error(
          `POST /noticias ${res.status} ${await safeText(res)}`
        );
      const created = await res.json();
      if (created?.id && form.imagenes?.length)
        await uploadImagesJson(created.id, form.imagenes);

      await fetchNoticias();
      setForm({
        nombre: "",
        titulo: "",
        tipo: "",
        mdContent: "",
        imagenes: [],
      });
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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/noticias/${edit.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok)
        throw new Error(
          `PUT /noticias/${edit.id} ${res.status} ${await safeText(res)}`
        );
      if (edit.imagenesNew?.length)
        await uploadImagesJson(edit.id, edit.imagenesNew);

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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/noticias/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`DELETE /noticias/${id} ${res.status}`);
      await fetchNoticias();
      if (selected?.id === id) {
        setSelected(null);
        setDetailOpen(false);
      }
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

  const closeEdit = () =>
    setEdit((s) => ({ ...s, open: false, imagenesNew: [] }));

  const closeDetail = () => {
    setDetailOpen(false);
    setSelected(null);
  };

  /* ---------------- PAGINACIÓN ---------------- */
  const hasNoticias = noticias.length > 0;
  const totalPages = hasNoticias
    ? Math.max(1, Math.ceil(noticias.length / PAGE_SIZE))
    : 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedNoticias = hasNoticias
    ? noticias.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      )
    : [];

  /* ---------------- RENDER ---------------- */
  if (!user || user.rol !== "administrador") return <SoloAdmin />;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 text-neutral-900">
      <NavbarBlanco />
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-10 lg:py-16 space-y-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div><br/>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Panel de Noticias
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Crea, edita y administra las noticias que se muestran al público.
            </p>
          </div>
          <Link
            to="/noticias"
            className="inline-flex items-center rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
          >
            Ver lista pública
          </Link>
        </header>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* CREATE */}
        <section className="rounded-3xl bg-white border border-neutral-200 p-6 lg:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Crear noticia</h2>
              <p className="mt-1 text-sm text-neutral-600 max-w-xl">
                Completa la información y añade contenido en formato enriquecido.
              </p>
            </div>
            {loading && (
              <span className="text-xs text-neutral-500">
                Guardando cambios…
              </span>
            )}
          </div>

          <form onSubmit={onCreate} className="grid md:grid-cols-2 gap-5">
            <TextInput
              label="Nombre"
              value={form.nombre}
              onChange={(v) => setForm((s) => ({ ...s, nombre: v }))}
              placeholder="Nombre del autor o responsable"
            />
            <TextInput
              label="Título"
              value={form.titulo}
              onChange={(v) => setForm((s) => ({ ...s, titulo: v }))}
              placeholder="Título visible de la noticia"
            />

            <TipoInput
              value={form.tipo}
              onChange={(v) => setForm((s) => ({ ...s, tipo: v }))}
              opciones={tiposExistentes}
              listId="tipos-noticia-create"
            />

            <div className="md:col-span-2 space-y-2">
              <Label>Contenido</Label>
              <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50">
                <RichTextEditor
                  valueMarkdown={form.mdContent}
                  onChangeMarkdown={(md) =>
                    setForm((s) => ({ ...s, mdContent: md }))
                  }
                  height={editorHeight}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Imágenes (múltiples, opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-xs file:font-medium file:text-sky-700 hover:file:bg-sky-100"
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    imagenes: Array.from(e.target.files || []),
                  }))
                }
              />
              {!!form.imagenes?.length && (
                <p className="text-xs text-neutral-600">
                  {form.imagenes.length} archivo(s) seleccionados.
                </p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-xl bg-sky-500 hover:bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creando…" : "Crear noticia"}
              </button>
            </div>
          </form>
        </section>

        {/* LIST */}
        <section className="rounded-3xl bg-white border border-neutral-200 p-6 lg:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold">Noticias</h2>
              <span className="text-sm text-neutral-500">
                {noticias.length} en total
              </span>
            </div>

            <button
              onClick={() => setListOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
            >
              <span className="text-base leading-none">
                {listOpen ? "▾" : "▸"}
              </span>
              {listOpen ? "Ocultar noticias" : "Mostrar noticias"}
            </button>
          </div>

          {!listOpen ? (
            <p className="text-neutral-600 text-sm">
              Pulsa <strong>“Mostrar noticias”</strong> para desplegar el
              listado.
            </p>
          ) : loading ? (
            <p className="text-neutral-700 text-sm">Cargando…</p>
          ) : noticias.length === 0 ? (
            <p className="text-neutral-700 text-sm">No hay noticias aún.</p>
          ) : (
            <>
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedNoticias.map((n) => {
                  const firstImg =
                    (Array.isArray(n.imagenes) &&
                      n.imagenes[0]?.imageUrl) ||
                    n.imagenUrl ||
                    null;
                  return (
                    <li
                      key={n.id}
                      className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                    >
                      {firstImg ? (
                        <img
                          src={firstImg}
                          alt={n.titulo}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-neutral-100 grid place-items-center text-neutral-500 text-sm">
                          Sin imagen
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-3 flex-1">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold line-clamp-2">
                            {n.titulo || "—"}
                          </h3>
                          <p className="text-xs text-neutral-700 line-clamp-1">
                            {n.nombre || "—"}
                          </p>
                          <p className="text-[11px] text-neutral-500 flex flex-wrap gap-1 items-center">
                            <span>{fmtDate(n.fechaCreacion)}</span>
                            <span className="text-neutral-300">•</span>
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium">
                              {n.tipo || "Sin tipo"}
                            </span>
                          </p>
                        </div>

                        <div className="pt-1">
                          <label className="inline-flex items-center justify-center rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-medium text-black hover:bg-amber-400 cursor-pointer">
                            Agregar imágenes
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              ref={(el) =>
                                (addImagesRefs.current[n.id] = el)
                              }
                              onChange={(e) =>
                                onAddImagesFromList(
                                  n.id,
                                  Array.from(e.target.files || [])
                                )
                              }
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                          <button
                            onClick={() => fetchNoticiaById(n.id)}
                            disabled={busyId === n.id}
                            className="inline-flex items-center rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-green-200 disabled:opacity-60"
                          >
                            {busyId === n.id ? "Abriendo…" : "Ver"}
                          </button>
                          <button
                            onClick={() => openEdit(n)}
                            className="inline-flex items-center rounded-lg bg-sky-200 px-3 py-1.5 text-xs font-medium text-black hover:bg-sky-300"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(n.id)}
                            disabled={busyId === n.id}
                            className="inline-flex items-center rounded-lg bg-red-200 px-3 py-1.5 text-xs font-medium text-black hover:bg-red-400 disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
                  <p className="text-xs text-neutral-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* DETAIL MODAL */}
      {detailOpen && selected && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
          <div
            className="w-full max-w-4xl rounded-2xl bg-white border border-neutral-200 flex flex-col shadow-2xl"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white/90">
              <div>
                <h3 className="text-xl font-bold">
                  Detalle de noticia
                </h3>
                <p className="text-xs text-neutral-500">
                  Vista previa de cómo se ve el contenido.
                </p>
              </div>
              <button
                onClick={closeDetail}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Cerrar
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <article className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-extrabold">
                    {selected.titulo}
                  </h3>
                  <span className="text-xs bg-neutral-100 text-neutral-700 rounded-full px-3 py-1 font-medium">
                    {selected.tipo || "—"}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  Por{" "}
                  <strong>{selected.nombre || "—"}</strong> ·{" "}
                  {fmtDate(selected.fechaCreacion)}{" "}
                  <span className="text-neutral-300">•</span> Actualizado{" "}
                  {fmtDate(selected.fechaActualizacion)}
                </p>

                {Array.isArray(selected.imagenes) &&
                selected.imagenes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selected.imagenes.map((img, idx) => (
                      <div
                        key={img.imagePath || idx}
                        className="relative group"
                      >
                        <img
                          className="w-full h-40 object-cover rounded-xl border border-neutral-200"
                          src={img.imageUrl}
                          alt={`img-${idx}`}
                        />
                        <button
                          onClick={() =>
                            onRemoveImage(selected.id, img.imagePath)
                          }
                          disabled={busyId === selected.id}
                          className="absolute top-2 right-2 text-[10px] rounded-full bg-red-600 text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : selected.imagenUrl ? (
                  <img
                    className="w-full max-h-96 object-cover rounded-xl border border-neutral-200"
                    src={selected.imagenUrl}
                    alt={selected.titulo}
                  />
                ) : (
                  <div className="w-full h-40 bg-neutral-100 grid place-items-center text-neutral-500 text-sm rounded-xl border border-neutral-200">
                    Sin imágenes
                  </div>
                )}

                <div className="prose max-w-none prose-sm sm:prose-base">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {selected.mdContent || "*Sin contenido*"}
                  </ReactMarkdown>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {edit.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
          <div
            className={`w-full ${
              editFullscreen ? "max-w-[95vw]" : "max-w-3xl"
            } rounded-2xl bg-white border border-neutral-200 flex flex-col shadow-2xl`}
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white/90">
              <div>
                <h3 className="text-xl font-bold">Editar noticia</h3>
                <p className="text-xs text-neutral-500">
                  Ajusta el texto, tipo o imágenes de la noticia.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setEditFullscreen((v) => !v)
                  }
                  className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  {editFullscreen
                    ? "Ventana"
                    : "Pantalla completa"}
                </button>
                <button
                  onClick={closeEdit}
                  className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              <form
                onSubmit={onUpdate}
                className="grid md:grid-cols-2 gap-5"
              >
                <TextInput
                  label="Nombre"
                  value={edit.nombre}
                  onChange={(v) =>
                    setEdit((s) => ({ ...s, nombre: v }))
                  }
                />
                <TextInput
                  label="Título"
                  value={edit.titulo}
                  onChange={(v) =>
                    setEdit((s) => ({ ...s, titulo: v }))
                  }
                />

                <TipoInput
                  value={edit.tipo}
                  onChange={(v) =>
                    setEdit((s) => ({ ...s, tipo: v }))
                  }
                  opciones={tiposExistentes}
                  listId="tipos-noticia-edit"
                />

                <div className="md:col-span-2 space-y-2">
                  <Label>Contenido</Label>
                  <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50">
                    <RichTextEditor
                      valueMarkdown={edit.mdContent}
                      onChangeMarkdown={(md) =>
                        setEdit((s) => ({
                          ...s,
                          mdContent: md,
                        }))
                      }
                      height={
                        editFullscreen
                          ? Math.max(
                              500,
                              window.innerHeight * 0.6
                            )
                          : editorHeight
                      }
                      placeholder="Edita el contenido…"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Agregar nuevas imágenes</Label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-xs file:font-medium file:text-sky-700 hover:file:bg-sky-100"
                    onChange={(e) =>
                      setEdit((s) => ({
                        ...s,
                        imagenesNew: Array.from(
                          e.target.files || []
                        ),
                      }))
                    }
                  />
                  {!!edit.imagenesNew?.length && (
                    <p className="text-xs text-neutral-600">
                      {edit.imagenesNew.length} archivo(s) para
                      subir al guardar.
                    </p>
                  )}
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 sticky bottom-0 bg-white/90 flex flex-wrap gap-3 justify-end">
              <button
                onClick={onUpdate}
                disabled={busyId === edit.id}
                className="inline-flex items-center rounded-xl bg-sky-600 hover:bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busyId === edit.id
                  ? "Guardando…"
                  : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
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
  return (
    <label className="text-xs font-medium uppercase tracking-wide text-neutral-600">
      {children}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
      />
    </div>
  );
}

function TipoInput({ value, onChange, opciones, listId }) {
  const options = opciones || [];
  return (
    <div className="space-y-2">
      <Label>Tipo</Label>
      <input
        list={listId}
        className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Selecciona un tipo o escribe uno nuevo"
      />
      <datalist id={listId}>
        {options.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <p className="mt-1 text-[11px] text-neutral-500">
        Usa un tipo existente o inventa uno nuevo.
      </p>
    </div>
  );
}
