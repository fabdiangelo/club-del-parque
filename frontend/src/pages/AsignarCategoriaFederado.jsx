import React, { useEffect, useMemo, useState } from "react";
import NavbarBlanco from "../components/NavbarBlanco.jsx";
import SoloAdmin from "../components/SoloAdmin";
import { useAuth } from "../contexts/AuthProvider";
import {
  Award,
  Users,
  Search,
  RefreshCw,
  Loader2,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

/* ---------------- utils ---------------- */
const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);
const fetchJSON = async (path, opts = {}) => {
  const res = await fetch(toApi(path), {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    credentials: "include",
    cache: "no-store",
    ...opts,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
};
const norm = (s = "") =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/* -------------- page ------------------- */
export default function AsignarCategoriaFederado() {
  const { user, loading: authLoading } = useAuth();

  const [federados, setFederados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null); // federado ID currently saving
  const [localSel, setLocalSel] = useState({}); // { [federadoId]: categoriaId|null }

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [feds, cats] = await Promise.all([
        fetchJSON("/usuarios/federados"),
        fetchJSON("/categorias"),
      ]);

      const catsSorted = (Array.isArray(cats) ? cats : [])
        .map((c) => ({ ...c, orden: Number(c?.orden ?? 0) }))
        .sort(
          (a, b) =>
            a.orden - b.orden || (a?.nombre || "").localeCompare(b?.nombre || "")
        );

      setCategorias(catsSorted);

      const list = Array.isArray(feds) ? feds : [];
      list.sort((a, b) =>
        `${a?.nombre || ""} ${a?.apellido || ""}`.localeCompare(
          `${b?.nombre || ""} ${b?.apellido || ""}`,
          "es"
        )
      );
      setFederados(list);

      // inicializar selects locales con lo que venga de backend
      const initSel = {};
      for (const f of list) {
        initSel[f.id] = f?.categoriaId ?? null;
      }
      setLocalSel(initSel);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.rol !== "administrador") return;
    loadAll();
  }, [user, authLoading]);

  const catsById = useMemo(() => {
    const m = new Map();
    categorias.forEach((c) => c?.id && m.set(c.id, c));
    return m;
  }, [categorias]);

  const list = useMemo(() => {
    const q = norm(query);
    if (!q) return federados;
    return federados.filter((f) => {
      const name = norm(`${f?.nombre || ""} ${f?.apellido || ""}`);
      const email = norm(f?.email || f?.mail || "");
      return name.includes(q) || email.includes(q);
    });
  }, [federados, query]);

  function categoriaActualLabel(f) {
    const id = f?.categoriaId ?? null;
    if (!id) return "Sin categoría";
    return catsById.get(id)?.nombre || "Sin categoría";
  }

  async function saveOne(federadoId) {
    const categoriaId = localSel[federadoId] ?? null;
    setSavingId(federadoId);
    setErr("");
    try {
      await fetchJSON(`/federados/${encodeURIComponent(federadoId)}/categoria`, {
        method: "PATCH",
        body: JSON.stringify({ categoriaId }),
      });

      // reflejar en memoria
      setFederados((arr) =>
        arr.map((f) =>
          f.id === federadoId ? { ...f, categoriaId: categoriaId ?? null } : f
        )
      );
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  if (!user || user.rol !== "administrador") {
    return <SoloAdmin />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      <div
        className="overflow-hidden"
        style={{
          backgroundImage: "url('/FondoAdmin.svg')",
          width: "100vw",
          height: (25 + federados.length * 5) + "rem",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          position: "absolute",
          bottom: 0,
          left: 0,
        }}
      />
      <NavbarBlanco />
      <div className="max-w-7xl mx-auto relative" style={{ marginTop: "3rem", zIndex: 1 }}>
        {/* Header */}
        <div className="mb-8" style={{ marginTop: "4rem", zIndex: 1 }}>
          <div className="flex items-center justify-between mb-6 mt-10">
            <h1 className="text-3xl font-bold text-white">
              Asignar Categoría a Federados
              <RefreshCw
                className="ml-4 inline cursor-pointer"
                style={{ color: "#4AC0E4" }}
                onClick={loadAll}
                aria-label="Refrescar"
              />
            </h1>
          </div>

          <div className="flex gap-3 items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                placeholder="Buscar federado por nombre o email"
                className="input input-bordered w-full pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {err && (
              <div className="flex items-center gap-2 text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{err}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="overflow-x-auto flex flex-col justify-center">
            <table className="table w-full">
              <thead>
                <tr className="text-gray-300">
                  <th>Federado</th>
                  <th>Email</th>
                  <th>Actual</th>
                  <th>Asignar</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={`sk-${i}`} className="text-white">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={`sk-${i}-${j}`} className="py-3">
                          <div className="h-5 w-full max-w-[16rem] animate-pulse rounded bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-400 py-6">
                      No se encontraron federados.
                    </td>
                  </tr>
                ) : (
                  list.map((f) => {
                    const fullName = `${f?.nombre || ""} ${f?.apellido || ""}`.trim();
                    const selected = localSel[f.id] ?? null;

                    return (
                      <tr key={f.id} className="text-white">
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              federado
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-4 h-4" style={{ color: "#4AC0E4" }} />
                            {fullName || "—"}
                          </div>
                        </td>

                        <td className="text-white max-w-md">
                          <p className="truncate">{f?.email || "—"}</p>
                        </td>

                        <td className="text-sm">
                          {categoriaActualLabel(f)}
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <select
                              className="select select-bordered"
                              value={selected ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLocalSel((s) => ({
                                  ...s,
                                  [f.id]: val === "" ? null : val,
                                }));
                              }}
                            >
                              {/* opción para quitar */}
                              <option value="">— Sin categoría —</option>
                              {/* opciones reales */}
                              {categorias.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre} (cap: {c.capacidad})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        <td>
                          <button
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#4AC0E4",
                              borderColor: "#4AC0E4",
                              color: "white",
                            }}
                            onClick={() => saveOne(f.id)}
                            disabled={savingId === f.id}
                          >
                            {savingId === f.id ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando…
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Guardar
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => (window.location.href = "/administracion/usuarios")}
                className="btn btn-lg"
                style={{
                  backgroundColor: "#4AC0E4",
                  borderColor: "#4AC0E4",
                  color: "white",
                }}
              >
                <Check className="w-5 h-5 mr-2 inline" />
                Volver a Usuarios
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-white/70">
          Tip: podés **quitar** la categoría eligiendo “Sin categoría” y
          presionando <strong>Guardar</strong>.
        </div>
      </div>
    </div>
  );
}
