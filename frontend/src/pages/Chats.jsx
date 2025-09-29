import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider.jsx";
import UserModal from "../components/UserModal.jsx";
import { getDatabase, ref, onValue, push, set } from "firebase/database";
import { dbRT } from "../utils/FirebaseService.js";
const Chats = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const mensajesEndRef = useRef(null);

  const { user } = useAuth();

  // Obtener usuarios para crear chat
  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/usuarios`);
      if (!response.ok) throw new Error("Error fetching users");
      const data = await response.json();
      const filtro = data.filter((u) => u.id !== user.uid);

      console.log(filtro);
      setUsuarios(filtro);
    } catch (error) {
      console.error(error);
    }
  };

  // Crear chat usando endpoint REST
  const handleCreateChat = async (usuarioSeleccionado) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante1: user.uid, participante2: usuarioSeleccionado.id }),
      });
      if (!response.ok) throw new Error('Error creando chat');
      const nuevoChat = await response.json();
      await fetchChats(); // recarga la lista de chats
      setSelectedChat({ ...nuevoChat, name: usuarioSeleccionado.nombre });
    } catch (error) {
      console.error(error);
    }
  };

  // Obtener los chats del usuario al cargar y tras crear chat
  const fetchChats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/chats/${user.uid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error obteniendo chats');
      const data = await response.json();
      setChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setChats([]);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchChats();
  }, [user]);
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/chats/${user.uid}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Error obteniendo chats');

        const data = await response.json();
        console.log(data);
        setChats(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };
    if (user?.uid) fetchChats();
  }, [user]);

  useEffect(() => {
    const fetchMensajes = async () => {
      if (!selectedChat?.id) return;
      try {
        console.log("SELECTED CHAT ID => ", selectedChat.id);
        const response = await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/chats/${selectedChat.id}/mensajes`);
        
        if (!response.ok) return null;
        
        const data = await response.json();

        const formateado = data.map(msg => {
          return {
            ...msg,
            fechaFormateada: msg.fecha ? new Date(msg.fecha._seconds * 1000).toLocaleTimeString() : '',
          };
        });
        console.log(formateado);

        setMensajes(Array.isArray(formateado) ? formateado : []);
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        console.error(error);
        setMensajes([]);
      }
    };
    fetchMensajes();
  }, [selectedChat]);

  useEffect(() => {
  if (!selectedChat?.id) return;
  const mensajesRef = ref(dbRT, `chats/${selectedChat.id}/mensajes`);
  const unsubscribe = onValue(mensajesRef, (snapshot) => {
    const data = snapshot.val() || {};
    const mensajesEnTiempoReal = Object.entries(data).map(([id, msg]) => ({
      id,
      ...msg,
      fechaFormateada: msg.fecha
        ? new Date(msg.fecha).toLocaleTimeString()
        : "",
    }));
    setMensajes(mensajesEnTiempoReal);
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });
  return () => mensajesRef.off && mensajesRef.off();
}, [selectedChat]);

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!nuevoMensaje.trim()) return;

  const mensajesRef = ref(dbRT, `chats/${selectedChat.id}/mensajes`);
  const nuevoRef = push(mensajesRef);
  await set(nuevoRef, {
    autorId: user.uid,
    contenido: nuevoMensaje,
    fecha: Date.now(),
  });
  try {
    await fetch(`${import.meta.env.VITE_LINKTEMPORAL}/chats/${selectedChat.id}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contenido: nuevoMensaje,
        autorId: user.uid,
        fecha: Date.now(),
      }),
    });
  } catch (error) {
    console.error("Error actualizando último mensaje en el chat:", error);
  }

  setNuevoMensaje("");
};

  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      
      <div className="flex flex-col lg:flex-row w-full max-w-[1200px] h-full max-h-[800px] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="w-full lg:w-1/3 border-r border-gray-300 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-gray-300">
            <h2 className="text-xl font-bold text-black">Chats</h2>
            <button
              className="btn btn-sm btn-circle bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => {
                setIsOpen(true);
                fetchUsuarios();
              }}
            >
                +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {Array.isArray(chats) && chats.length > 0 ? (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition
                    ${selectedChat?.id === chat.id ? "bg-blue-100" : ""}`}
                >
                  <h3 className="font-medium text-black">{chat.name || chat.id}</h3>
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage || ""}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-500">No tienes chats aún.</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-300 flex items-center bg-white">
                <h2 className="font-bold text-lg text-black">{selectedChat.name}</h2>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {mensajes.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.autorId === user.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`chat-bubble px-4 py-2 max-w-[70%] ${msg.autorId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                      <span>{msg.contenido}</span>
                      <div className="text-xs text-right mt-1 opacity-70">
                        {msg.fechaFormateada || 'Fecha invalida'}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 flex gap-2 bg-white">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="input input-bordered flex-1 border-gray-300"
                  value={nuevoMensaje}
                  onChange={e => setNuevoMensaje(e.target.value)}
                />
                <button type="submit" className="btn bg-blue-500 text-white hover:bg-blue-600">
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecciona un chat para empezar
            </div>
          )}
        </div>
      </div>

      <UserModal
        users={usuarios}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectUser={handleCreateChat}
        />
    </div>
  );
};

export default Chats;
