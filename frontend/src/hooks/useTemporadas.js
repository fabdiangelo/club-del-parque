import { useCallback, useEffect, useState } from "react";

export default function useTemporadas() {
  const [items, setItems] = useState([]);
  const [activa, setActiva] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toApi = (p) => (p.startsWith("/api/") ? p : `/api${p}`);
  const fetchJson = async (url, init) => {
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  };

  const refetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [list, active] = await Promise.all([
        fetchJson(toApi("/temporadas")),
        fetchJson(toApi("/temporadas/activa")),
      ]);
      setItems(list);
      setActiva(active || null);
    } catch (e) {
      setError(e?.message?.replace('{"error":"',"").replace('"}',"") || "Error");
    } finally { setLoading(false); }
  }, []);

  const create = useCallback(async (payload) => {
    setLoading(true); setError("");
    try {
      await fetchJson(toApi("/temporadas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      await refetch();
      return true;
    } catch (e) {
      setError(e?.message || "Error creando temporada");
      setLoading(false);
      return false;
    }
  }, [refetch]);

  const activate = useCallback(async (id) => {
    setLoading(true); setError("");
    try {
      await fetchJson(toApi(`/temporadas/${id}/activar`), {
        method: "PUT",
        credentials: "include",
      });
      await refetch();
      return true;
    } catch (e) {
      setError(e?.message || "Error activando");
      setLoading(false);
      return false;
    }
  }, [refetch]);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, activa, loading, error, create, activate };
}
