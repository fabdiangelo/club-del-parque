import { db, FieldValue } from '../FirebaseServices.js';


export class ChatPort {

    constructor() {
        this.db = db;
    }

    pairKey(participantes) {
        return [...participantes].sort().join('___');
    }


    async agregarChat(chat) {
        
        const { participante1, participante2 } = chat.participantes;

        !participante1 || !participante2 ? (() => { throw new Error("Debe haber al menos un participante") })() : null;


        console.log("Creando un chat..." + chat);
        try {
            
            const chatExist = await this.buscarChatPorId(chat.id);

            if (chatExist) {
                throw new Error("El chat ya existe");
            }

            const pairKey = this.pairKey(chat.participantes);
            
            
            const datos = {
                ...chat,
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
        try {
            const docRef =  this.db.collection('chats').doc(chatId);

            const snapshot = await docRef.get();

            if (!snapshot.exists) {
                throw new Error("Chat no encontrado");
            }


            return {ref: doc, data: snapshot.data()};


        } catch(error) {
            console.error("Error buscando chat por ID:", error);

            throw new error;
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

        try {
            const chatRef = await this.buscarChatPorId(chatId);

            if (!chatRef.get().exists) {
                throw new Error("Chat no encontrado");
            }

            const mensaje = {
                ...nuevoMensaje,
            }

            await chatRef.ref.collection('mensajes').add(mensaje);

        } catch(error) {
            console.error("Error enviando mensaje:", error);
            throw error;
        }

    }

    async obtenerMensajes(chatId) {
        try {
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
            if (!participantes || participantes.length < 2) {
                throw new Error("Debe haber al menos dos participantes para crear un chat");
            }

            const pairKey = this.pairKey(participantes);
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

            const q = this.db.collection('chats').where('participantes', 'array-contains', usuarioId);

            return await q.get().then(snapshot => {
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });

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