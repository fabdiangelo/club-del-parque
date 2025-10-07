import { onValue, ref } from "firebase/database";
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from '../contexts/AuthProvider.jsx';
import { dbRT } from "../utils/FirebaseService.js";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notiCount, setNotiCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const response = ref(dbRT, 'chats/');
    const unsuscribe = onValue(response, (snap) => {
      const data = snap.val();
      const dataArr = Array.isArray(data) ? data : Object.values(data || {});
      const chatsDelUsuario = dataArr.filter((chat) =>
        chat.participantes &&
        (chat.participantes[0]?.uid === user.uid || chat.participantes[1]?.uid === user.uid)
      );

      let total = 0;
      chatsDelUsuario.forEach((chat) => {
        if (chat.mensajes) {
          const mensajesArr = Array.isArray(chat.mensajes)
            ? chat.mensajes
            : Object.values(chat.mensajes);
          mensajesArr.forEach((msg) => {
            if (!msg.leido && msg.autor?.uid !== user.uid) {
              total++;
            }
          });
        }
      });

      setNotiCount(total);
    });
    return () => unsuscribe();
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notiCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}