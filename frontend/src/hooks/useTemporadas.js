import { useCallback, useEffect, useState } from "react";

export default function useTemporadas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);

  const fetchJson = async (url, init) => {
    const r = await fetch(url, init);
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      throw new Error(txt || `HTTP ${r.status}`);
    }
    return r.json();
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchJson(toApi("/temporadas"));
      // Aseguramos array
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      // Backend puede responder {error:"..."}
      const msg = (e?.message || "Error").replace('{"error":"', "").replace('"}', "");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload) => {
      // Espera: { nombre, fechaInicio, fechaFin } (según tu controlador)
      setLoading(true);
      setError("");
      try {
        await fetchJson(toApi("/temporadas"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            nombre: payload.nombre,
            fechaInicio: payload.fechaInicio,
            fechaFin: payload.fechaFin,
          }),
        });
        await refetch();
        return true;
      } catch (e) {
        const msg = (e?.message || "Error creando temporada").replace('{"error":"', "").replace('"}', "");
        setError(msg);
        setLoading(false);
        return false;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id) => {
      if (!id) return false;
      setLoading(true);
      setError("");
      try {
        const url = toApi(`/temporadas/${encodeURIComponent(id)}`);
        const r = await fetch(url, { method: "DELETE", credentials: "include" });
        if (!r.ok && r.status !== 204) {
          const txt = await r.text().catch(() => "");
          throw new Error(txt || `HTTP ${r.status}`);
        }
        await refetch();
        return true;
      } catch (e) {
        const msg = (e?.message || "Error eliminando").replace('{"error":"', "").replace('"}', "");
        setError(msg);
        setLoading(false);
        return false;
      }
    },
    [refetch]
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, loading, error, create, remove };
}
