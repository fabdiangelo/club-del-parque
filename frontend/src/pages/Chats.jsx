

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
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


  const { user } = useAuth();
  
  const agregarMensaje = async (chatId) => {
    if (!chatId || !nuevoMensaje.trim()) return;
    const mensajeRef = ref(dbRT, `chats/${chatId}/mensajes`);
    const nuevoMensajeRef = push(mensajeRef);
    await set(nuevoMensajeRef, {
      id: nuevoMensajeRef.key,
      autor: user,
      contenido: nuevoMensaje.trim(),
      timestamp: Date.now(),
      leido: false
    });
    const ultimoRef = ref(dbRT, `chats/${chatId}/ultimoMensaje`);
    await set(ultimoRef, { autor: user, contenido: nuevoMensaje.trim(), timestamp: Date.now() });
    console.log("Mensaje agregado:", nuevoMensaje.trim());
    setNuevoMensaje('');
  };


  const enviarReporte = async(e) => {

        const formInfo = {
            tipo: 'reporte_jugador',
            motivo: "Se reporta al usuario con mail: " + (chatSeleccionado.participantes.filter(p => p.uid !== user.uid).map(p => p.email) || "Desconocido"),
            descripcion: textoReporte,
            estado: 'pendiente',
            mailUsuario: user ? user.email : 'anónimo',
            leido: false
        }


        try {
            const response = await fetch(`api/reportes`, {
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
    console.log("Seleccionando chat con ID:", chatId);

    // Limpia el listener anterior si existe
    if (mensajesListenerRef.current) {
      mensajesListenerRef.current();
      mensajesListenerRef.current = null;
    }

   


    const response = ref(dbRT, `chats/${chatId}`);
    const snap = await get(response);

    if (snap.exists()) {
      const chatData = snap.val();
      setChatSeleccionado(chatData);

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
    console.log(participante1, participante2);
    try {

      const response = ref(dbRT, 'chats/');

      const buscar = onValue(response, (snap) => {
        const data = snap.val();

        const dataArr = Array.isArray(data) ? data : Object.values(data);

        dataArr.map((c) => {
          if (c.participantes[0]?.uid === participante1.uid && c.participantes[1]?.uid === participante2.uid ||
            c.participantes[0]?.uid === participante2.uid && c.participantes[1]?.uid === participante1.uid) {
            setChatSeleccionado(c);
            return;
          }
        });
      });

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


    } catch (error) {
      throw error;
    }

  }

  const cargarUsuarios = async () => {
 
    try {
      const response = await fetch("/api/usuarios", {
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
          return d;
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
  }, [user]);


useEffect(() => {
  return () => {
    if (mensajesListenerRef.current) {
      mensajesListenerRef.current(); // Esto desuscribe el listener
      mensajesListenerRef.current = null;
    }
  };
}, []);


  return (
    <>
      <NavbarBlanco />

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
              <textarea style={{height: '200px', width: '400px', resize: 'none'}} className='input' placeholder='Escribe tu reporte aquí...' value={textoReporte} onChange={(e) => setTextoReporte(e.target.value)} />
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
                await crearChat();
                setShowModal(false);
                setUsuarioSeleccionado(null);
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
          minHeight: "90vh",
          background: "white"
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 320,
            maxWidth: 400,
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
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
                  style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px' }}
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioInfo.nombre || usuarioInfo.email || "U")}&background=0D8ABC&color=fff&size=128`}
                  alt="avatar"
                />
                <h2 style={{ fontWeight: 600, fontSize: "1.4rem", marginBottom: '8px' }}>{usuarioInfo.nombre} {usuarioInfo.apellido || ''}</h2>

                <div style={{ fontSize: '1em', color: '#555', marginBottom: '24px'}}>
                  <p style={{textAlign: 'right'}}>Ranking: </p>
                  <p style={{textAlign: 'left'}}>{usuarioInfo.ranking || '-'}</p>
                </div>
                <div style={{ fontSize: '1em', color: '#555', marginBottom: '24px' }}>
                  <span>Categoría: </span>
                  <span>{usuarioInfo.categoria || ''}</span>
                </div>
                <div style={{ fontSize: '1em', color: '#555', marginBottom: '24px' }}>
                  <span>Mejor Posición en torneo: </span>
                  <span>{usuarioInfo.mejorPosicionTorneo || ''}</span>
                </div>
                <div style={{ fontSize: '1em', color: '#555', marginBottom: '24px' }}>Partidos oficiales ganados: {usuarioInfo.partidosOficialesGanados || ''}</div>
                <div style={{ fontSize: '1em', color: '#555', marginBottom: '24px' }}>Partidos oficiales perdidos: {usuarioInfo.partidosOficialesPerdidos || ''}</div>
                <button
                  style={{
                    background: "#0D8ABC",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 24px",
                    fontWeight: 600,
                    fontSize: "1em",
                    cursor: "pointer"
                  }}
                  onClick={() => setVerUsuario(false)}
                >
                  Volver a los chats
                </button>
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