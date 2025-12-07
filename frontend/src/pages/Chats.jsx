// Hook para obtener el ranking de un usuario
const useRankingStats = (usuarioID) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!usuarioID) return;
    const fetchRanking = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rankings/usuario/${usuarioID}/mejor`, { credentials: 'include' });
        if (!res.ok) return setStats(null);
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      }
    };
    fetchRanking();
  }, [usuarioID]);
  return stats;
};
import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../styles/Chats.css'
import { dbRT } from '../utils/FirebaseService.js'
import { ref, onValue, getDatabase, push, set, get, update } from 'firebase/database';
import { useAuth } from '../contexts/AuthProvider.jsx';
import NavbarBlanco from '../components/NavbarBlanco.jsx';



const Chats = () => {
  const scrollRef = useRef(null);

  const [chats, setChats] = useState([])
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSeleccionado, setChatSeleccionado] = useState(null);
  const [chatSeleccionadoId, setChatSeleccionadoId] = useState(null);

  const [mensajesChat, setMensajesChat] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [verUsuario, setVerUsuario] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [textoReporte, setTextoReporte] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState(null);
  const [notificaciones, setNotificaciones] = useState({});
  const mensajesListenerRef = useRef(null);
  const [showModalReporte, setShowModalReporte] = useState(false);
  const [showModalPartido, setShowModalPartido] = useState(false);
  const [fechaPartido, setFechaPartido] = useState('');
  const [quienPaga, setQuienPaga] = useState('');

  const [alertaReserva, setAlertaReserva] = useState(false);
  const [mensajeReserva, setMensajeReserva] = useState('');
  const [tipoMensajeReserva, setTipoMensajeReserva] = useState(null);

  const { user } = useAuth();
  const { id: routeUserId } = useParams();
  const pendingCreationsRef = useRef(new Set());

  // --- Ranking stats logic ---
  const [yoID, setYoID] = useState(null);
  const [otroID, setOtroID] = useState(null);
  useEffect(() => {
    if (chatSeleccionado && user?.uid) {
      const participanteIDs = chatSeleccionado.participantes.map(p => p.uid);
      setYoID(user.uid);
      setOtroID(participanteIDs.find(id => id !== user.uid));
    } else {
      setYoID(null);
      setOtroID(null);
    }
  }, [chatSeleccionado, user]);
  const yoStats = useRankingStats(yoID);
  const otroStats = useRankingStats(otroID);

  const generarReservaPartido = async () => {

    console.log("Generando reserva para el partido el día", fechaPartido, "a ser cobrado a", quienPaga);

    if (!fechaPartido || !quienPaga) {

      setAlertaReserva(true);
      setMensajeReserva("Por favor, complete todos los campos");
      setTipoMensajeReserva("error");


      setTimeout(() => {
        setAlertaReserva(false);
        setMensajeReserva('');
        setTipoMensajeReserva(null);
      }, 2000);
      return;
    }
    if (new Date(fechaPartido) < new Date()) {
      setAlertaReserva(true);
      setMensajeReserva("La fecha del partido no puede ser en el pasado");
      setTipoMensajeReserva("error");

      setTimeout(() => {
        setAlertaReserva(false);
        setMensajeReserva('');
        setTipoMensajeReserva(null);

      }, 2000);
      return;
    }

    if (!chatSeleccionado) {
      setAlertaReserva(true);
      setMensajeReserva("No hay chat seleccionado");
      setTipoMensajeReserva("error");

      setTimeout(() => {
        setAlertaReserva(false);
        setMensajeReserva('');
        setTipoMensajeReserva(null);
      }, 2000);
      return;
    }


    const mensajeRef = ref(dbRT, `chats/${chatSeleccionado.id}/mensajes`);
    const nuevoMensajeRef = push(mensajeRef);
    const contenidoMensaje = `Se ha generado una reserva para un partido el día ${new Date(fechaPartido).toLocaleString()} a ser cobrado a ${chatSeleccionado.participantes.find(p => p.uid === quienPaga)?.nombre || 'Desconocido'}.`;

    const nuevoMensaje = push(mensajeRef);
    await set(nuevoMensaje, {
      id: nuevoMensaje.key,
      autor: user,
      tipo: 'reserva_partido',
      contenido: contenidoMensaje,
      timestamp: Date.now(),
      leido: false
    });
    const ultimoRef = ref(dbRT, `chats/${chatSeleccionado.id}/ultimoMensaje`);
    await set(ultimoRef, { autor: user, contenido: contenidoMensaje, timestamp: Date.now() });

    setShowModalPartido(false);
  }

  const agregarMensaje = async (chatId) => {
    if (!chatId || !nuevoMensaje.trim()) return;
    const mensajeRef = ref(dbRT, `chats/${chatId}/mensajes`);
    const nuevoMensajeRef = push(mensajeRef);
    await set(nuevoMensajeRef, {
      id: nuevoMensajeRef.key,
      autor: user,
      tipo: 'normal',
      contenido: nuevoMensaje.trim(),
      timestamp: Date.now(),
      leido: false
    });
    const ultimoRef = ref(dbRT, `chats/${chatId}/ultimoMensaje`);
    await set(ultimoRef, { autor: user, contenido: nuevoMensaje.trim(), timestamp: Date.now() });

    setNuevoMensaje('');
  };


  const enviarReporte = async (e) => {

    const formInfo = {
      tipo: 'reporte_jugador',
      motivo: "Se reporta al usuario con mail: " + (chatSeleccionado.participantes.filter(p => p.uid !== user.uid).map(p => p.email) || "Desconocido"),
      descripcion: textoReporte,
      estado: 'pendiente',
      mailUsuario: user ? user.email : 'anónimo',
      leido: false
    }


    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formInfo),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el reporte');
      }

      const data = await response.json();
      console.log('Success:', data);

      setMensaje('Reporte enviado con éxito');
      setTipoMensaje('success');


      setTextoReporte('');

    } catch (error) {
      console.error('Error:', error);

      setMensaje(error.message);
      setTipoMensaje('error');
    }


    setTimeout(() => {
      setMensaje(null);
    }, 3000);
  }



  const seleccionarChat = async (chatId) => {

    if (mensajesListenerRef.current) {
      mensajesListenerRef.current();
      mensajesListenerRef.current = null;
    }




    const response = ref(dbRT, `chats/${chatId}`);
    const snap = await get(response);

    if (snap.exists()) {
      const chatData = snap.val();
      setChatSeleccionado(chatData);
      setChatSeleccionadoId(chatData.id);

      const mensajeRef = ref(dbRT, `chats/${chatId}/mensajes`);
      const unsubscribe = onValue(mensajeRef, (mensajeSnap) => {
        const data = mensajeSnap.val() || {};
        const mensajesArr = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        setMensajesChat(mensajesArr);

        mensajesArr.forEach((msg) => {
          if (!msg.leido && msg.autor?.uid !== user.uid) {
            const msgRef = ref(dbRT, `chats/${chatId}/mensajes/${msg.id}`);
            console.log("Marcando mensaje como leído:", msg.id);
            update(msgRef, { leido: true });
          }
        });
      });
      mensajesListenerRef.current = unsubscribe;
      return;
    }
  };

  const crearChat = async () => {
    console.log("ENTRANDO A CREAR CHAT");
    const participante1 = {
      uid: user.uid,
      nombre: user.nombre,
      email: user.email
    };

    const participante2 = {
      uid: usuarioSeleccionado.id,
      nombre: usuarioSeleccionado.nombre,
      email: usuarioSeleccionado.email
    }
    try {

      const response = ref(dbRT, 'chats/');

      // First check if chat already exists
      const snap = await get(response);
      if (snap.exists()) {
        const data = snap.val();
        const dataArr = Array.isArray(data) ? data : Object.values(data);

        for (let c of dataArr) {
          if (c.participantes[0]?.uid === participante1.uid && c.participantes[1]?.uid === participante2.uid ||
            c.participantes[0]?.uid === participante2.uid && c.participantes[1]?.uid === participante1.uid) {
            setChatSeleccionado(c);
            setChatSeleccionadoId(c.id);
            // subscribe to messages
            if (mensajesListenerRef.current) {
              mensajesListenerRef.current();
              mensajesListenerRef.current = null;
            }
            const mensajeRef = ref(dbRT, `chats/${c.id}/mensajes`);
            const unsubscribe = onValue(mensajeRef, (mensajeSnap) => {
              const data = mensajeSnap.val() || {};
              const mensajesArr = Object.entries(data).map(([id, msg]) => ({
                id,
                ...msg
              }));
              setMensajesChat(mensajesArr);
            });
            mensajesListenerRef.current = unsubscribe;
            return;
          }
        }
      }

      // If not found, create new chat
      const nuevoChatRef = push(response);

      if (!nuevoChatRef) {
        return;
      }

      const obj = {
        id: nuevoChatRef.key,
        participantes: [participante1, participante2],
        mensajes: [],
        ultimoMensaje: 'Todavía no hay mensajes'
      }

      await set(nuevoChatRef, obj);
      setChatSeleccionado(obj);
      setChatSeleccionadoId(obj.id);

      // Subscribe to messages for the newly created chat
      if (mensajesListenerRef.current) {
        mensajesListenerRef.current();
        mensajesListenerRef.current = null;
      }
      const mensajeRef = ref(dbRT, `chats/${obj.id}/mensajes`);
      const unsubscribe = onValue(mensajeRef, (mensajeSnap) => {
        const data = mensajeSnap.val() || {};
        const mensajesArr = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg
        }));
        setMensajesChat(mensajesArr);
      });
      mensajesListenerRef.current = unsubscribe;


    } catch (error) {
      throw error;
    }

  }

  // Try to open or create a chat with a user id (route param)
  const abrirOCrearChatPorUserId = async (otherUserId) => {
    if (!otherUserId || !user?.uid) return;

    try {
      // First search existing chats for this user
      const response = ref(dbRT, 'chats/');
      const snap = await get(response);
      if (snap.exists()) {
        const data = snap.val();
        const dataArr = Array.isArray(data) ? data : Object.values(data);
        const encontrado = dataArr.find(c =>
          c.participantes && (
            (c.participantes[0]?.uid === user.uid && c.participantes[1]?.uid === otherUserId) ||
            (c.participantes[1]?.uid === user.uid && c.participantes[0]?.uid === otherUserId)
          )
        );
        if (encontrado) {
          setChatSeleccionado(encontrado);
          setChatSeleccionadoId(encontrado.id);
          // subscribe to messages (clean previous listener first)
          if (mensajesListenerRef.current) {
            mensajesListenerRef.current();
            mensajesListenerRef.current = null;
          }
          const mensajeRef = ref(dbRT, `chats/${encontrado.id}/mensajes`);
          const unsubscribe = onValue(mensajeRef, (mensajeSnap) => {
            const data = mensajeSnap.val() || {};
            const mensajesArr = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
            setMensajesChat(mensajesArr);
          });
          mensajesListenerRef.current = unsubscribe;
          return;
        }
      }

      // If not found, fetch user info to set participante2
      // Prevent concurrent creations for same otherUserId (in-memory)
      if (pendingCreationsRef.current.has(otherUserId)) {
        return;
      }

      // Also use a persistent lock in localStorage to survive StrictMode double-mounts
      const lockKey = `creating_chat_${user.uid}_${otherUserId}`;
      const lockTTL = 10000; // 10s
      const existingLock = localStorage.getItem(lockKey);
      if (existingLock) {
        try {
          const parsed = JSON.parse(existingLock);
          if (Date.now() - parsed.ts < lockTTL) {
            // another creation in progress recently
            return;
          }
        } catch (e) {
          // ignore parse
        }
      }

      // Re-check chats once more right before creating to avoid race conditions
      const snap2 = await get(response);
      if (snap2.exists()) {
        const data2 = snap2.val();
        const dataArr2 = Array.isArray(data2) ? data2 : Object.values(data2);
        const encontrado2 = dataArr2.find(c =>
          c.participantes && (
            (c.participantes[0]?.uid === user.uid && c.participantes[1]?.uid === otherUserId) ||
            (c.participantes[1]?.uid === user.uid && c.participantes[0]?.uid === otherUserId)
          )
        );
        if (encontrado2) {
          setChatSeleccionado(encontrado2);
          setChatSeleccionadoId(encontrado2.id);
          if (mensajesListenerRef.current) {
            mensajesListenerRef.current();
            mensajesListenerRef.current = null;
          }
          const mensajeRef = ref(dbRT, `chats/${encontrado2.id}/mensajes`);
          const unsubscribe2 = onValue(mensajeRef, (mensajeSnap) => {
            const data = mensajeSnap.val() || {};
            const mensajesArr = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
            setMensajesChat(mensajesArr);
          });
          mensajesListenerRef.current = unsubscribe2;
          return;
        }
      }

      const usuarioRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuario/${otherUserId}`, { credentials: 'include' });
      if (!usuarioRes.ok) {
        console.warn('No se pudo obtener info del usuario', otherUserId);
        return;
      }
      const usuarioData = await usuarioRes.json();
      setUsuarioSeleccionado({ id: usuarioData.id, nombre: usuarioData.nombre, email: usuarioData.email });

      // create chat and select it
      // re-use crearChat but that expects usuarioSeleccionado state; ensure it's set
      const participante1 = { uid: user.uid, nombre: user.nombre, email: user.email };
      const participante2 = { uid: usuarioData.id, nombre: usuarioData.nombre, email: usuarioData.email };

      const chatsRef = ref(dbRT, 'chats/');
      // mark pending to avoid duplicate creations (in-memory)
      pendingCreationsRef.current.add(otherUserId);

      // set persistent lock
      localStorage.setItem(lockKey, JSON.stringify({ ts: Date.now() }));
      let weSetLock = true;

      // Use deterministic key based on sorted UIDs to avoid duplicate chats with different IDs
      const chatKey = [user.uid, usuarioData.id].sort().join('__');
      const chatRef = ref(dbRT, `chats/${chatKey}`);
      const existingChatSnap = await get(chatRef);
      const obj = {
        id: chatKey,
        participantes: [participante1, participante2],
        mensajes: [],
        ultimoMensaje: 'Todavía no hay mensajes'
      };
      try {
        if (existingChatSnap && existingChatSnap.exists()) {
          const existing = existingChatSnap.val();
          setChatSeleccionado(existing);
          setChatSeleccionadoId(existing.id);
        } else {
          await set(chatRef, obj);
          setChatSeleccionado(obj);
          setChatSeleccionadoId(obj.id);

          // subscribe to messages for the newly created chat
          if (mensajesListenerRef.current) {
            mensajesListenerRef.current();
            mensajesListenerRef.current = null;
          }
          const mensajeRefNew = ref(dbRT, `chats/${obj.id}/mensajes`);
          const unsubscribeNew = onValue(mensajeRefNew, (mensajeSnap) => {
            const data = mensajeSnap.val() || {};
            const mensajesArr = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
            setMensajesChat(mensajesArr);
          });
          mensajesListenerRef.current = unsubscribeNew;
        }
      } finally {
        // remove pending flags and locks
        pendingCreationsRef.current.delete(otherUserId);
        if (weSetLock) localStorage.removeItem(lockKey);
      }


    } catch (error) {
      console.error('Error al abrir o crear chat por userId', error);
    }
  }

  const cargarUsuarios = async () => {

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        console.log(response.text())
        throw new Error("Error cargando usuarios");
      }

      const data = await response.json();
      const dataFiltrada = data.map((d) => {

        if (d.id != user?.uid) {
          return { ...d, uid: d.id };
        }
      }).filter(Boolean);

      const noRepetirChats = dataFiltrada.map((d) => {
        console.log(chats);

        if (!chats || chats.length === 0) {
          return d;
        }
        chats.map((c) => {
          if (c.participantes[0]?.uid === user.uid && c.participantes[1]?.uid === d.id ||
            c.participantes[0]?.uid === d.id && c.participantes[1]?.uid === user.uid) {
            return null;
          }
          return d;
        });
      }).filter(Boolean);
      setUsuarios(noRepetirChats);
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!user?.uid) return;
    cargarUsuarios();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatSeleccionado, mensajesChat]);



  useEffect(() => {
    const response = ref(dbRT, 'chats/');
    const unsuscribe = onValue(response, (snap) => {
      const data = snap.val();
      const dataArr = Array.isArray(data) ? data : Object.values(data || {});
      const chatsDelUsuario = dataArr.filter((chat) =>
        chat.participantes &&
        (chat.participantes[0]?.uid === user?.uid || chat.participantes[1]?.uid === user?.uid)
      );
      setChats(chatsDelUsuario);

      // Si hay un chat seleccionado por ID, actualiza el objeto chatSeleccionado con la data más reciente
      if (chatSeleccionadoId) {
        const chatActualizado = chatsDelUsuario.find(c => c.id === chatSeleccionadoId);
        if (chatActualizado) {
          setChatSeleccionado(chatActualizado);
        }
      }

      const notifs = {};
      chatsDelUsuario.forEach((chat) => {
        let count = 0;
        if (chat.mensajes) {
          const mensajesArr = Array.isArray(chat.mensajes)
            ? chat.mensajes
            : Object.values(chat.mensajes);
          mensajesArr.forEach((msg) => {
            if (!msg.leido && msg.autor?.uid !== user?.uid) {
              count++;
            }
          });
        }
        notifs[chat.id] = count;
      });
      console.log("NOTIFS", notifs)

      setNotificaciones(notifs);
    });
    return () => unsuscribe();
  }, [user, chatSeleccionadoId]);


  // When route param is present, try to open or create chat
  useEffect(() => {
    if (!routeUserId) return;
    // If the route points to the same as the logged-in user, ignore
    if (user?.uid && routeUserId === user.uid) return;

    abrirOCrearChatPorUserId(routeUserId);
  }, [routeUserId, user]);


  useEffect(() => {
    return () => {
      if (mensajesListenerRef.current) {
        mensajesListenerRef.current();
        mensajesListenerRef.current = null;
      }
    };
  }, []);


  return (
    <>
      <NavbarBlanco />

      {alertaReserva && (
        <div
          role="alert"
          className={`alert alert-${tipoMensajeReserva === 'success' ? 'success' : 'error'}`}
          style={{
            position: "fixed",
            left: "32px",
            bottom: "32px",
            zIndex: 9999,
            minWidth: "300px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tipoMensajeReserva === 'success'
              ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <span>{mensajeReserva}</span>
        </div>
      )}

      {mensaje && (
        <div
          role="alert"
          className={`alert alert-${tipoMensaje === 'success' ? 'success' : 'error'}`}
          style={{
            position: "fixed",
            left: "32px",
            bottom: "32px",
            zIndex: 9999,
            minWidth: "300px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tipoMensaje === 'success'
              ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <span>{mensaje}</span>
        </div>
      )}

      {showModalPartido && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            padding: "32px 24px",
            minWidth: "600px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative"
          }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px", justifyContent: 'space-between' }}>
              <label>Fecha y hora</label>
              <input className='input' value={fechaPartido} type="datetime-local" onChange={(e) => setFechaPartido(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px", justifyContent: 'space-between' }}>
              <label>Será cobrado a</label>
              <select className='input' value={quienPaga} onChange={(e) => setQuienPaga(e.target.value)}>
                {chatSeleccionado && chatSeleccionado.participantes.map((p) => (
                  <option key={p.uid} value={p.uid}>{p.nombre}</option>
                ))}
              </select>



            </div>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '5px' }}>
              <button style={{ color: 'white', backgroundColor: 'green', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => generarReservaPartido()}>Enviar</button>
              <button style={{ color: 'white', backgroundColor: 'red', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', ':hover': { backgroundColor: 'white' } }} onClick={() => setShowModalPartido(false)}>Cancelar</button>


            </div>
          </div>
        </div>
      )}


      {showModalReporte && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            padding: "32px 24px",
            minWidth: "320px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative"
          }}>
            <button
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "#e0e0e0",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "1.2rem",
                cursor: "pointer"
              }}
              onClick={() => setShowModalReporte(false)}
            >
              ×
            </button>
            <div style={{ maxHeight: "100vh", overflowY: "auto", marginTop: '30px' }}>
              <textarea style={{ height: '200px', width: '400px', resize: 'none' }} className='input' placeholder='Escribe tu reporte aquí...' value={textoReporte} onChange={(e) => setTextoReporte(e.target.value)} />
            </div>
            <button
              style={{
                marginTop: "18px",
                background: textoReporte ? "#dc2618ff" : "#e0e0e0",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: "1em",
                cursor: textoReporte ? "pointer" : "not-allowed"
              }}
              disabled={!textoReporte}
              onClick={async () => {
                if (!textoReporte) return;
                await enviarReporte();
                setShowModalReporte(false);
              }}
            >
              Reportar
            </button>
          </div>
        </div>
      )}


      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
            padding: "32px 24px",
            minWidth: "320px",
            maxWidth: "90vw",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative"
          }}>
            <button
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "#e0e0e0",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "1.2rem",
                cursor: "pointer"
              }}
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div style={{ maxHeight: "50vh", overflowY: "auto", marginTop: '30px' }}>
              {usuarios.length === 0 ? (
                <p style={{ color: "#888" }}>No hay otros usuarios disponibles.</p>
              ) : (
                usuarios.map(u => (
                  <div
                    key={u.id}
                    style={{
                      padding: "10px 16px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      background: usuarioSeleccionado?.id === u.id ? "#e3f2fd" : "#f9f9f9",
                      cursor: "pointer",
                      border: usuarioSeleccionado?.id === u.id ? "2px solid #0D8ABC" : "1px solid #e0e0e0",
                      fontWeight: 500
                    }}
                    onClick={() => setUsuarioSeleccionado(u)}
                  >

                    {u.nombre}
                  </div>
                ))
              )}
            </div>
            <button
              style={{
                marginTop: "18px",
                background: usuarioSeleccionado ? "#0D8ABC" : "#e0e0e0",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontWeight: 600,
                fontSize: "1em",
                cursor: usuarioSeleccionado ? "pointer" : "not-allowed"
              }}
              disabled={!usuarioSeleccionado}
              onClick={async () => {
                if (!usuarioSeleccionado) return;
                try {
                  await crearChat();
                  setShowModal(false);
                  setUsuarioSeleccionado(null);
                } catch (error) {
                  console.error('Error al crear chat:', error);
                }
              }}
            >
              Crear chat
            </button>
          </div>
        </div>
      )}
      <div
        className="chats-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "white",
          paddingTop: '50px'
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 320,
            maxWidth: 400,
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(12, 12, 12, 0.08)",
            padding: "24px",
            marginRight: "32px",
            display: "flex",
            flexDirection: "column",
            height: "600px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontWeight: 500, fontSize: "1.3rem" }}>Conversaciónes</h2>
            <button
              style={{
                background: "#0D8ABC",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#fff",
                fontSize: "1.5rem",
                cursor: "pointer"
              }}
              onClick={() => setShowModal(true)}
            >
              +
            </button>
          </div>
          <div>
            <input
              placeholder="Buscar chat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                fontSize: "1em"
              }}
            />
          </div>
          <div style={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "8px",
            background: "#f9f9f9"
          }}>
            {verUsuario && usuarioInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <img
                  style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px' }}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioInfo.nombre || usuarioInfo.email || "U")}&background=0D8ABC&color=fff&size=128`}
                  alt="avatar"
                />
                <h2 style={{ fontWeight: 600, fontSize: "1.4rem", marginBottom: '8px' }}>{usuarioInfo.nombre} {usuarioInfo.apellido || ''}</h2>

                {/* Estadísticas reales del otro jugador */}
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '24px', display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                  <span>Ranking: </span>
                  <span>{otroStats?.ranking?.puntos ?? '-'}</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '24px', display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                  <span>Categoría: </span>
                  <span>{otroStats?.ranking?.categoriaId ? String(otroStats.ranking.categoriaId).split('|')[4]?.toUpperCase() : '-'}</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '24px', display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                  <span>Partidos Ganados: </span>
                  <span>{otroStats?.ranking?.partidosGanados ?? '-'}</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#555', marginBottom: '24px', display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                  <span>Partidos Perdidos: </span>
                  <span>{otroStats?.ranking?.partidosPerdidos ?? '-'}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      background: "#0D8ABC",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontWeight: 600,
                      fontSize: "1em",
                      cursor: "pointer"
                    }}
                    onClick={() => setVerUsuario(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : chats.length === 0 ? (
              <p style={{ color: "#888" }}>No tienes chats aún.</p>
            ) : (
              chats
                .filter(chat =>
                  chat.participantes.some(p =>
                    p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
                .map(chat => (
                  <div
                    key={chat.id}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      background: chatSeleccionado?.id === chat.id ? "#e3f2fd" : "#fff",
                      cursor: "pointer",
                      boxShadow: chatSeleccionado?.id === chat.id ? "0 2px 8px rgba(13,138,188,0.08)" : "none",
                      position: "relative"
                    }}
                    onClick={() => seleccionarChat(chat.id)}
                  >
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{chat.participantes.map(p => p.nombre).join(", ")}</span>
                      {notificaciones[chat.id] > 0 && (
                        <span style={{
                          background: '#0D8ABC',
                          color: '#fff',
                          borderRadius: '50%',
                          padding: '4px 10px',
                          fontSize: '0.9em',
                          marginLeft: '8px',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(13,138,188,0.12)'
                        }}>
                          {notificaciones[chat.id]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.95em", color: "#666" }}>
                      {chat.ultimoMensaje?.contenido || "Sin mensajes"}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        <div
          style={{
            flex: 2,
            minWidth: 400,
            maxWidth: 700,
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            height: "600px"
          }}
        >
          {chatSeleccionado && chatSeleccionado.id ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: "16px", borderBottom: "1px solid #e0e0e0", paddingBottom: "8px" }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
                  onClick={() => {
                    const info = chatSeleccionado.participantes.find(p => p.uid !== user.uid);
                    setUsuarioInfo(info);
                    setVerUsuario(true);
                  }}
                >
                  <img
                    style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      chatSeleccionado.participantes.filter(p => p.uid !== user.uid).map(p => p.nombre) || chatSeleccionado.participantes.filter(p => p.uid !== user.uid).map(p => p.email) || "U"
                    )}&background=0D8ABC&color=fff&size=128`}
                    alt="avatar"
                  />
                  <h2 style={{ fontWeight: 400, fontSize: "1.2rem" }}>
                    {chatSeleccionado.participantes.filter(p => p.uid !== user.uid).map(p => p.nombre).join(", ")}
                  </h2>
                </div>
                <div>
                  <button style={{ cursor: 'pointer' }} onClick={() => setShowModalReporte(true)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="red" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  </button>
                </div>
              </div>
              <div ref={scrollRef} style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: "16px",
                borderRadius: "8px",
                padding: "12px"
              }}>
                {mensajesChat.length === 0 ? (
                  <p style={{ color: "#888" }}>No hay mensajes en este chat.</p>
                ) : (
                  mensajesChat.map((m, idx) => {
                    const autorUid = m.autor?.uid || m.autorId;
                    const esUsuarioActual = autorUid === user.uid;
                    if (m.tipo === 'reserva_partido') {
                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "16px"
                          }}
                        >
                          <div
                            style={{
                              background: "#fffbe6",
                              color: "#222",
                              border: "2px solid #fbbf24",
                              borderRadius: "18px",
                              padding: "16px 20px",
                              maxWidth: "80%",
                              fontSize: "1.05em",
                              boxShadow: "0 2px 8px rgba(251,191,36,0.08)",
                              alignSelf: "center",
                              position: "relative"
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>Reserva de partido</div>
                            <div style={{ marginBottom: '10px' }}>{m.contenido}</div>
                            <div style={{ fontSize: "0.8em", textAlign: "right", marginTop: "4px", opacity: 0.7 }}>
                              {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                              <button style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => alert('Reserva aceptada')}>Aceptar</button>
                              <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => alert('Reserva rechazada')}>Rechazar</button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    // Mensaje normal
                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          display: "flex",
                          justifyContent: esUsuarioActual ? "flex-end" : "flex-start",
                          marginBottom: "10px"
                        }}
                      >
                        <div
                          style={{
                            background: esUsuarioActual ? "#0D8ABC" : "#ebe6e6ff",
                            color: esUsuarioActual ? "#fff" : "#222",
                            borderRadius: esUsuarioActual ? "16px 16px 4px 16px" : "16px 16px 16px 4px", // burbuja diferente
                            padding: "10px 16px",
                            maxWidth: "70%",
                            fontSize: "1em",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            alignSelf: esUsuarioActual ? "flex-end" : "flex-start"
                          }}
                        >
                          <div>{m.contenido}</div>
                          <div style={{ fontSize: "0.8em", textAlign: "right", marginTop: "4px", opacity: 0.7 }}>
                            {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  agregarMensaje(chatSeleccionado.id);
                }}
                style={{ display: "flex", gap: "8px" }}
              >
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  style={{
                    flex: 1,
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    padding: "10px",
                    fontSize: "1em"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#0D8ABC",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 24px",
                    fontWeight: 600,
                    fontSize: "1em",
                    cursor: "pointer"
                  }}
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div style={{ color: "#888", textAlign: "center", marginTop: "40%" }}>
              Selecciona un chat para empezar
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Chats;