import { db, FieldValue } from '../FirebaseServices.js';


export class ChatPort {

    constructor() {
        this.db = db;
    }

    pairKey(participantes) {
    const arr = Array.isArray(participantes)
        ? participantes
        : Object.values(participantes); // toma los valores del objeto
    return arr.sort().join('___');
    }


    async agregarChat(chat) {
        
        const { participante1, participante2 } = chat.participantes;

        !participante1 || !participante2 ? (() => { throw new Error("Debe haber al menos un participante") })() : null;


        const existenUsuarios = await Promise.all(chat.participantes.map(async (uid) => {
            const userDoc = await this.db.collection('usuarios').doc(uid).get();
            return userDoc.exists;
        }));

        if (!existenUsuarios.every(Boolean)) {
            throw new Error("Uno o más participantes no existen");
        }

        console.log("Creando un chat..." + chat);
        try {
            
            const chatExist = await this.buscarChatPorId(chat.id);

            if (chatExist) {
                throw new Error("El chat ya existe");
            }

            const pairKey = this.pairKey(chat.participantes);
            
            
            const datos = {
                participantes: [participante1, participante2],
                lastMessage: "Inicia la conversación",
                pairKey: pairKey
            }
            
            const docRef = this.db.collection('chats').add(datos);


            
            return docRef.id
        } catch(error) {
            console.log(error);
            throw error;
        }
    }


    async buscarChatPorId(chatId) {

        console.log("Buscando chat por ID:", chatId);
        if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
            throw new Error('chatId inválido');
        }
        try {
            const docRef =  this.db.collection('chats').doc(chatId);
            console.log(docRef);
            const snapshot = await docRef.get();
            console.log(snapshot);
            if (!snapshot.exists) {
                return null;
            }


            return {ref: docRef, data: snapshot.data()};


        } catch(error) {
            console.error("Error buscando chat por ID:", error);

            throw error;
        }
    }

    async buscarChatPorPairKey(participantes) {
        try {

            const pairKey = this.pairKey(participantes);
            const query = this.db.collection('chats').where('pairKey', '==', pairKey).limit(1).doc();
            const snapshot = await query.get();
            if(!snapshot.empty) {
                throw new Error("No se ha encontrado el chat");
            }


            return {ref: query, data: snapshot.data()};

        } catch(error) {
            console.info("Error buscando chat por pairKey:", error);
            throw error;
        }

    } 


    // Mensajes

    async enviarMensaje(chatId, nuevoMensaje) {

        if(!chatId || !nuevoMensaje) throw new Error("chatId y nuevoMensaje son requeridos");

        const { autorId, contenido } = nuevoMensaje;




        !autorId || !contenido ? (() => { throw new Error("El mensaje debe tener autorId y contenido") })() : null;

        try {
            
            const chatRef = await this.buscarChatPorId(chatId);
            console.log(chatRef);


            const mensaje = {
                ...nuevoMensaje,
                lastMessage: contenido,
                fecha: FieldValue.serverTimestamp()
            }

            console.log("Mensaje a enviar:", mensaje);

            const msjRef = await chatRef.ref.collection('mensajes').add(mensaje);

            return msjRef.id;
        } catch(error) {
            console.error("Error enviando mensaje:", error);
            throw error;
        }

    }

    async obtenerMensajes(chatId) {
        try {
            console.log("Obteniendo mensajes para chatId:", chatId);

            const chatRef = await this.buscarChatPorId(chatId);
            if (!chatRef.data) {
                throw new Error("Chat no encontrado");
            }

            const mensajesSnapshot = await chatRef.ref.collection('mensajes').get();
            const mensajes = mensajesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            return mensajes;

        } catch(error) {
            throw error;
        }
    }

    async crearChat(participantes) {
        try {

            console.log("Creando chat con participantes desde CHATPORT:", participantes);
            if (!participantes || participantes.length < 2) {
                throw new Error("Debe haber al menos dos participantes para crear un chat");
            }

            const pairKey = this.pairKey(participantes);

            console.log("pairkey:", pairKey);
            const datos = {
                participantes,
                pairKey
            };

            const docRef = await this.db.collection('chats').add(datos);

            return docRef.id;
        } catch (error) {
            console.error("Error creando chat:", error);
            throw error;
        }
    }

 async obtenerChatsDeUsuario(usuarioId) {
    try {

        const snapshot = await db.collection('chats').get();
const chats = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(chat => {
    console.log(chat);
    return (chat.participantes?.participante1 === usuarioId ||
 chat.participantes?.participante2 === usuarioId)
  });
  return chats;
    } catch(error) {
        throw error;
    }
}



    escucharNuevosMensajes(chatId, callback) {
        const q = this.db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc');

        const unsubscribe = q.onSnapshot(
        snap => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(items);
        },
        err => console.error('Listener mensajes error:', err)
        );

        return unsubscribe;
    }

}