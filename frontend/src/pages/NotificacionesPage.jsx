// src/pages/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { onValue, ref, update, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import NavbarBlanco from "../components/NavbarBlanco";
import { useAuth } from "../contexts/AuthProvider.jsx";
import { dbRT } from "../utils/FirebaseService.js";

const toArray = (x) => (Array.isArray(x) ? x : Object.values(x || {}));
const isChatId = (id) => String(id).startsWith("chat:");

function lastMessageFrom(chat) {
  const um = chat?.ultimoMensaje;
  if (um && typeof um === "object") {
    return { contenido: um.contenido || "—", timestamp: um.timestamp || 0 };
  }
  const msgs = toArray(chat?.mensajes);
  if (msgs.length === 0) return { contenido: "Sin mensajes", timestamp: 0 };
  const last = [...msgs]
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .at(-1);
  return {
    contenido: last?.contenido || "Sin mensajes",
    timestamp: last?.timestamp || 0,
  };
}

/** Marca como leídos TODOS los mensajes no leídos de un chat (autor ≠ usuario actual) */
async function markChatUnreadAsRead(chatId, currentUid) {
  if (!chatId || !currentUid) return;
  const snap = await get(ref(dbRT, `chats/${chatId}/mensajes`));
  const msgsObj = snap.val() || {};
  const patch = {};
  for (const [mid, m] of Object.entries(msgsObj)) {
    const autorUid = m?.autor?.uid || m?.autorId;
    if (!m?.leido && autorUid !== currentUid) {
      patch[`${mid}/leido`] = true;
    }
  }
  if (Object.keys(patch).length > 0) {
    await update(ref(dbRT, `chats/${chatId}/mensajes`), patch);
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [backendNotis, setBackendNotis] = useState([]); // {id,tipo,resumen,fecha,leido,href?}
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(new Set()); // ids backend y chat:xxx
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  // Backend notifications (todas: leídas y no leídas)
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

  // Chats del usuario
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
      setChats(mine);
    });
    return () => u();
  }, [user?.uid]);

  // Filas de chat con contador de no leídos y preview
  const chatRows = useMemo(() => {
    return chats.map((chat) => {
      const msgs = toArray(chat?.mensajes);
      let unread = 0;
      for (const m of msgs) {
        const autorUid = m?.autor?.uid || m?.autorId;
        if (!m?.leido && autorUid !== user?.uid) unread++;
      }
      const last = lastMessageFrom(chat);
      return {
        id: `chat:${chat.id}`,
        tipo: "chat",
        chatId: chat.id,
        resumen:
          unread > 0 ? `${unread} sin leer — ${last.contenido}` : last.contenido,
        fecha: last.timestamp || 0,
        leido: unread === 0,
        isChat: true,
      };
    });
  }, [chats, user?.uid]);

  // Mezclar backend + chats y ordenar
  const merged = useMemo(() => {
    const all = [...chatRows, ...backendNotis];
    return all.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  }, [chatRows, backendNotis]);

  const paginated = useMemo(
    () => merged.slice(0, PAGE_SIZE * page),
    [merged, page]
  );

  // Selección (permite backend y chat)
  const toggleSelected = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  // Acciones individuales
  async function markOneBackend(id, leido) {
    if (!user?.uid || !id) return;
    await update(ref(dbRT, `notificaciones/${user.uid}/${id}`), { leido });
  }
  async function markOneChatAsRead(chatId) {
    await markChatUnreadAsRead(chatId, user?.uid);
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(`chat:${chatId}`);
      return s;
    });
  }

  // Acciones masivas (seleccionadas)
  async function markSelectedAsRead() {
    if (!user?.uid || selected.size === 0) return;
    const backendIds = [];
    const chatIds = [];
    for (const id of selected) {
      if (isChatId(id)) chatIds.push(id.replace("chat:", ""));
      else backendIds.push(id);
    }
    if (backendIds.length > 0) {
      const patch = {};
      backendIds.forEach((id) => {
        patch[`${id}/leido`] = true;
      });
      await update(ref(dbRT, `notificaciones/${user.uid}`), patch);
    }
    if (chatIds.length > 0) {
      await Promise.all(
        chatIds.map((cid) => markChatUnreadAsRead(cid, user?.uid))
      );
    }
    setSelected(new Set());
  }

  // Seleccionar todo (incluye backend y chats visibles)
  const allSelected =
    paginated.length > 0 && paginated.every((row) => selected.has(row.id));

  // Accept / Reject invitation handlers
  async function acceptInvitation(noti) {
    if (!user?.uid || !noti) return;
    const campeonatoId =
      noti.campeonatoId || (noti.href && noti.href.split("/").pop());
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/federado-campeonato/${campeonatoId}/invitacion/aceptar`,
        { method: "PUT", credentials: "include" }
      );
      if (res.ok) {
        // mark backend notification as read
        await update(ref(dbRT, `notificaciones/${user.uid}/${noti.id}`), {
          leido: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function rejectInvitation(noti) {
    if (!user?.uid || !noti) return;
    const campeonatoId =
      noti.campeonatoId || (noti.href && noti.href.split("/").pop());
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/federado-campeonato/${campeonatoId}/invitacion/rechazar`,
        { method: "PUT", credentials: "include" }
      );
      if (res.ok) {
        await update(ref(dbRT, `notificaciones/${user.uid}/${noti.id}`), {
          leido: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-base-content w-full">
      <NavbarBlanco transparent={false} />

      {/* MAIN */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* TOP BAR */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--primario)" }}
          >
            Notificaciones
          </h1>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 md:items-center md:justify-end">
            <label className="label cursor-pointer text-sm mx-0 sm:mx-2 flex items-center">
              <input
                type="checkbox"
                className="checkbox checkbox-sm mr-2"
                checked={allSelected}
                onChange={(e) => {
                  const s = new Set(selected);
                  if (e.target.checked)
                    paginated.forEach((row) => s.add(row.id));
                  else paginated.forEach((row) => s.delete(row.id));
                  setSelected(s);
                }}
              />
              <span className="whitespace-nowrap">
                Seleccionar visibles ({paginated.length})
              </span>
            </label>

            <span className="text-sm opacity-70">
              Seleccionadas: {selected.size}
            </span>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={markSelectedAsRead}
                className="btn btn-primary btn-sm w-full sm:w-auto"
                disabled={selected.size === 0}
              >
                Marcar seleccionadas como leído
              </button>

              <button
                onClick={() => navigate("/chats")}
                className="btn btn-neutral btn-sm w-full sm:w-auto"
              >
                Ir a chats
              </button>
            </div>
          </div>
        </div>

        {/* LISTA / EMPTY STATE */}
        {paginated.length === 0 ? (
          <div className="card border border-neutral-200 bg-neutral-50 shadow">
            <div className="card-body items-center justify-center min-h-[220px] text-neutral-900">
              <p className="text-xl m-0 text-center">
                No tienes notificaciones por ahora
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-3">
            {paginated.map((row) => {
              const chat = row.isChat;
              const isSelected = selected.has(row.id);
              const onCardClick = () => toggleSelected(row.id);

              return (
                <li
                  key={row.id}
                  className={`card border border-neutral-200 rounded-xl shadow transition-colors
                              ${
                                isSelected ? "bg-sky-50" : "bg-neutral-50"
                              } ${row.leido && !chat ? "opacity-85" : ""}`}
                  onClick={onCardClick}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body text-neutral-900">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left side: checkbox + content */}
                      <div className="flex items-start gap-3 w-full">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm mt-1 flex-shrink-0"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelected(row.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          {/* Tipo + fecha */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            {!row.leido && !chat && (
                              <span className="inline-block h-2 w-2 rounded-full bg-sky-600" />
                            )}
                            <span className="uppercase tracking-wide">
                              {row.tipo || (chat ? "chat" : "sistema")}
                            </span>
                            {row.fecha && (
                              <span className="text-[11px] opacity-80">
                                {new Date(row.fecha).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Resumen */}
                          <div className="mt-1 font-medium text-sm sm:text-base break-words">
                            {row.resumen || "Actividad reciente"}
                          </div>

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {chat ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markOneChatAsRead(row.chatId);
                                  }}
                                  className="btn btn-primary btn-sm"
                                >
                                  Marcar como leído
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/chats");
                                  }}
                                  className="btn btn-outline btn-sm"
                                >
                                  Abrir chat
                                </button>
                              </>
                            ) : (
                              <>
                                {!row.leido && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markOneBackend(row.id, true);
                                    }}
                                    className="btn btn-primary btn-sm"
                                  >
                                    Marcar leída
                                  </button>
                                )}

                                {row.tipo === "invitacion_recibida" && (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        acceptInvitation(row);
                                      }}
                                      className="btn btn-success btn-sm"
                                    >
                                      Aceptar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        rejectInvitation(row);
                                      }}
                                      className="btn btn-error btn-sm"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                )}

                                {row.href &&
                                  row.tipo !== "invitacion_recibida" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(row.href);
                                      }}
                                      className="btn btn-outline btn-sm"
                                    >
                                      Abrir
                                    </button>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* LOAD MORE */}
        {PAGE_SIZE * page < merged.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-neutral"
            >
              Cargar más
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
