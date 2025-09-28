import { useState } from 'react';
import NavbarBlanco from '../components/NavbarBlanco';
import '../styles/Chats.css';

const Chats = () => {
    const [selectedChat, setSelectedChat] = useState(null);

    // Datos de ejemplo para los chats
    const [chats, setChats] = useState([
        {
            id: 1,
            nombre: "Juan Pérez",
            ultimoMensaje: "Hola, ¿cómo estás?",
            hora: "12:45",
            noLeidos: 2,
            avatar: "https://ui-avatars.com/api/?name=Juan+Perez&background=4AC0E4&color=fff"
        },
        {
            id: 2,
            nombre: "María García",
            ultimoMensaje: "Perfecto, nos vemos mañana",
            hora: "11:30",
            noLeidos: 0,
            avatar: "https://ui-avatars.com/api/?name=Maria+Garcia&background=4AC0E4&color=fff"
        },
        {
            id: 3,
            nombre: "Admin Club",
            ultimoMensaje: "Nueva actividad disponible",
            hora: "10:15",
            noLeidos: 1,
            avatar: "https://ui-avatars.com/api/?name=Admin+Club&background=383735&color=fff"
        }
    ]);

    // Mensajes del chat seleccionado
    const [mensajes, setMensajes] = useState({
        1: [
            { id: 1, texto: "Hola, ¿cómo estás?", propio: false, hora: "12:45" },
            { id: 2, texto: "¡Hola! Todo bien, gracias", propio: true, hora: "12:46" },
        ],
        2: [
            { id: 1, texto: "¿Confirmamos para mañana?", propio: false, hora: "11:25" },
            { id: 2, texto: "Sí, perfecto", propio: true, hora: "11:28" },
            { id: 3, texto: "Perfecto, nos vemos mañana", propio: false, hora: "11:30" },
        ],
        3: [
            { id: 1, texto: "Nueva actividad disponible", propio: false, hora: "10:15" },
        ]
    });

    const [nuevoMensaje, setNuevoMensaje] = useState('');

    const seleccionarChat = (chat) => {
        setSelectedChat(chat);
        // Marcar como leído
        setChats(prevChats => 
            prevChats.map(c => 
                c.id === chat.id ? { ...c, noLeidos: 0 } : c
            )
        );
    };

    const enviarMensaje = () => {
        if (!nuevoMensaje.trim() || !selectedChat) return;

        const mensaje = {
            id: Date.now(),
            texto: nuevoMensaje,
            propio: true,
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };

        setMensajes(prev => ({
            ...prev,
            [selectedChat.id]: [...(prev[selectedChat.id] || []), mensaje]
        }));

        setNuevoMensaje('');
    };

    return (
        <div className="chats-page">

            
            <div className="chats-layout">
                {/* COLUMNA IZQUIERDA - Lista de Chats */}
                <div className="chats-sidebar">
                    <div className="chats-header">
                        <h2>Chats</h2>
                        <button className="btn-nuevo-chat">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <div className="chats-search">
                        <input 
                            type="text" 
                            placeholder="Buscar chats..."
                            className="search-input"
                        />
                    </div>

                    <div className="chats-list">
                        {chats.map((chat) => (
                            <div 
                                key={chat.id}
                                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                                onClick={() => seleccionarChat(chat)}
                            >
                                <img src={chat.avatar} alt={chat.nombre} className="chat-avatar" />
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <h3 className="chat-nombre">{chat.nombre}</h3>
                                        <span className="chat-hora">{chat.hora}</span>
                                    </div>
                                    <div className="chat-preview">
                                        <p className="ultimo-mensaje">{chat.ultimoMensaje}</p>
                                        {chat.noLeidos > 0 && (
                                            <span className="badge-no-leidos">{chat.noLeidos}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMNA DERECHA - Chat Individual */}
                <div className="chat-individual">
                    {selectedChat ? (
                        <>
                            {/* Header del chat */}
                            <div className="chat-individual-header">
                                <img src={selectedChat.avatar} alt={selectedChat.nombre} className="chat-avatar-header" />
                                <div className="chat-individual-info">
                                    <h3>{selectedChat.nombre}</h3>
                                    <span className="estado">En línea</span>
                                </div>
                                <div className="chat-actions">
                                    <button className="btn-action">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-action">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Mensajes */}
                            <div className="mensajes-container">
                                {mensajes[selectedChat.id]?.map((mensaje) => (
                                    <div 
                                        key={mensaje.id}
                                        className={`mensaje ${mensaje.propio ? 'propio' : 'recibido'}`}
                                    >
                                        <div className="mensaje-contenido">
                                            <p>{mensaje.texto}</p>
                                            <span className="mensaje-hora">{mensaje.hora}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input para enviar mensajes */}
                            <div className="mensaje-input-container">
                                <input
                                    type="text"
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="mensaje-input"
                                    onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                                />
                                <button 
                                    onClick={enviarMensaje}
                                    className="btn-enviar"
                                    disabled={!nuevoMensaje.trim()}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-seleccionado">
                            <div className="no-chat-content">
                                <svg className="no-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <h3>Selecciona un chat</h3>
                                <p>Elige una conversación para comenzar a chatear</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chats;