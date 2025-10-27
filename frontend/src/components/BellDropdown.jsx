// src/components/BellDropdown.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { dbRT } from "../utils/FirebaseService.js";
import { useAuth } from "../contexts/AuthProvider.jsx";

const toArray = (x) => (Array.isArray(x) ? x : Object.values(x || {}));
const fmt = (ts) => {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
};

/**
 * BellDropdown
 * 
 * @param {string} color - "black" o "white" (default "white")
 */
export default function BellDropdown({ color = "white" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [backendNotis, setBackendNotis] = useState([]); 
  const [chatUnread, setChatUnread] = useState(0);      
  const box = useRef(null);

  // cerrar si clic fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Suscripción a notificaciones backend
  useEffect(() => {
    if (!user?.uid) return;
    const r = ref(dbRT, `notificaciones/${user.uid}`);
    const u = onValue(r, (snap) => {
      const obj = snap.val() || {};
      const list = Object.entries(obj).map(([id, v]) => ({ id, ...v }));
      list.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
      setBackendNotis(list);
    });
    return () => u();
  }, [user?.uid]);

  // Contar mensajes no leídos en chats
  useEffect(() => {
    if (!user?.uid) return;
    const r = ref(dbRT, "chats/");
    const u = onValue(r, (snap) => {
      const all = toArray(snap.val());
      const mine = all.filter(
        (c) =>
          c?.participantes &&
          (c.participantes[0]?.uid === user.uid ||
            c.participantes[1]?.uid === user.uid)
      );
      let total = 0;
      for (const chat of mine) {
        const msgs = toArray(chat?.mensajes);
        for (const m of msgs)
          if (!m?.leido && m?.autor?.uid !== user.uid) total++;
      }
      setChatUnread(total);
    });
    return () => u();
  }, [user?.uid]);

  // filtrar backend no leídas
  const unreadBackend = useMemo(
    () => backendNotis.filter((n) => !n?.leido),
    [backendNotis]
  );

  // Items del dropdown: item virtual de chats + backend no leídas
  const items = useMemo(() => {
    const chatItem =
      chatUnread > 0
        ? [
            {
              id: "__chats__",
              tipo: "chat",
              resumen:
                chatUnread === 1
                  ? "1 mensaje sin leer en chats"
                  : `${chatUnread} mensajes sin leer en chats`,
              fecha: Date.now(),
              leido: false,
              href: "/chats",
              isChatVirtual: true,
            },
          ]
        : [];
    return [...chatItem, ...unreadBackend.slice(0, 8)];
  }, [unreadBackend, chatUnread]);

  // badge muestra solo backend
  const badgeCount = unreadBackend.length;

  return (
    <div ref={box} className="relative" >
      <button
        aria-label="Notificaciones"
        style={{cursor: 'pointer'}}
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-full hover:bg-${color}/10 text-${color}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-neutral-900 ring-1 ring-white/10 shadow-xl overflow-hidden z-[300]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-white/90 text-sm">Notificaciones</span>
            <button
              onClick={() => navigate("/notificaciones")}
              className="text-xs text-white/70 hover:text-white"
            >
              Ver todo
            </button>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-white/60 text-sm">
              No tienes notificaciones
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="px-3 py-3 border-b border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-white/50">
                          {n.tipo || (n.isChatVirtual ? "chat" : "sistema")}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {fmt(n.fecha)}
                        </span>
                      </div>
                      <div className="text-sm text-white line-clamp-2">
                        {n.resumen || "Actividad reciente"}
                      </div>
                      <div className="mt-1">
                        <button
                          onClick={() => {
                            setOpen(false);
                            if (n.isChatVirtual) navigate("/chats");
                            else navigate("/notificaciones");
                          }}
                          className="text-sky-400 hover:text-sky-300 text-[12px]"
                        >
                          Abrir
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
