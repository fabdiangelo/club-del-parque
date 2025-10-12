import React, { useEffect, useMemo, useState } from "react";

export function PlayerPickerModal({
  initialSelected = [],
  players = [],
  maxCount = 2,
  onCancel,
  onSave,
  title = "Elegir jugadores",
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(() => new Set(initialSelected));

  useEffect(() => setSel(new Set(initialSelected)), [initialSelected]);

  const norm = (s = "") =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return players;
    const nq = norm(q);
    return players.filter((u) => {
      const name = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim();
      return (
        norm(name).includes(nq) ||
        norm(u.email || "").includes(nq) ||
        String(u.id).toLowerCase().includes(nq)
      );
    });
  }, [players, q]);

  const toggle = (id) => {
    setSel((curr) => {
      const next = new Set(curr);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= maxCount) return curr; // block beyond max
        next.add(id);
      }
      return next;
    });
  };

  const clearAll = () => setSel(new Set());
  const selectFirstNVisible = () => {
    const next = new Set();
    for (const u of filtered) {
      if (next.size >= maxCount) break;
      next.add(u.id);
    }
    setSel(next);
  };

  const selectedCount = sel.size;
  const remaining = Math.max(0, maxCount - selectedCount);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-neutral-900 text-white border border-white/20 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
          <div className="mt-2 text-xs text-white/70">
            Máx {maxCount}. Seleccionados: <strong>{selectedCount}</strong> ·
            Restantes: <strong>{remaining}</strong>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="search"
              placeholder="Buscar por nombre, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-white/20 bg-neutral-800 px-3 placeholder-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
            />
            <button
              type="button"
              onClick={selectFirstNVisible}
              className="h-10 px-3 rounded-lg border border-white/30 hover:bg-white/10"
              title="Seleccionar primeros visibles"
            >
              Seleccionar visibles
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="h-10 px-3 rounded-lg border border-white/30 hover:bg-white/10"
              title="Limpiar selección"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[60vh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-white/60 text-sm">Sin resultados</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((u) => {
                const name =
                  `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() ||
                  u.email ||
                  u.id;
                const checked = sel.has(u.id);
                return (
                  <li
                    key={u.id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-cyan-600"
                        checked={checked}
                        onChange={() => toggle(u.id)}
                      />
                      <span className="text-sm">{name}</span>
                    </label>
                    {u.email && (
                      <span className="text-xs text-white/60">{u.email}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-5 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave?.(Array.from(sel))}
            className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600"
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? "Seleccione jugadores" : "Guardar"}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
