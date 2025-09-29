
import { ChatRepository } from "../infraestructure/adapters/ChatRepository.js";
import { CrearChat } from "../usecases/Chat/CrearChat.js";
import { EnviarMensaje } from "../usecases/Chat/EnviarMensaje.js";
import { EscucharNuevosMensajes } from "../usecases/Chat/EscucharNuevosMensajes.js";
import { ObtenerChatPorId } from "../usecases/Chat/ObtenerChatPorId.js";
import { ObtenerChatsPorUsuario } from "../usecases/Chat/ObtenerChatsPorUsuario.js";
import { ObtenerMensajes } from "../usecases/Chat/ObtenerMensajes.js";

class ChatController {
    constructor() {
        this.obtenerChatPorIdUseCase = new ObtenerChatPorId(new ChatRepository());
        this.enviarMensajeUseCase = new EnviarMensaje(new ChatRepository());
        this.obtenerMensajesUseCase = new ObtenerMensajes(new ChatRepository());
        this.escucharNuevosMensajesUseCase = new EscucharNuevosMensajes(new ChatRepository());
        this.obtenerChatsPorUsuarioUseCase = new ObtenerChatsPorUsuario(new ChatRepository());
        this.crearChatUseCase = new CrearChat(new ChatRepository());
    
    }

    prueba() {
        return "Hello World";
    }

    getChatById = async(req, res) => {
        const { chatId } = req.params;
        const chat = await this.obtenerChatPorIdUseCase.execute(chatId);
        if(!chat) {
            return res.status(404).json({ error: "Chat no encontrado" });
        } else {

            res.json(chat);
        }
        
    }

    crearChat = async(req, res) => {
        
        console.log("ChatController - crearChat llamado");
        console.log("Request body:", req.body);
        try {
            console.log("Creando chat con datos:", req.body);
            

            const { participante1, participante2 } = req.body;
            const participantes = {
                participante1,
                participante2
            }
            const nuevoChat = await this.crearChatUseCase.execute(participantes);

            console.log("Chat creado con ID:", nuevoChat);
            return res.status(201).json(nuevoChat);
        } catch (error) {
            console.error("Error creando chat:", error);
            return res.status(500).json({ error: "Error creando chat" });
        }

    }

    enviarMensaje = async(req, res) => {
        const { autorId, contenido, chatId} = req.body;

    
        const message = { autorId, contenido };
        
        console.log("Enviando mensaje:", message, "al chatId:", chatId);
        
        if (!autorId || !chatId || !contenido) {
            return res.status(400).json({ error: "Faltan datos requeridos" });
        }

        const msj = await this.enviarMensajeUseCase.execute(chatId, message);
        return res.status(201).json(msj);
    }

    prueba = (req, res) => {
        res.send("Hello World");
    }

    getMensajes = async(req, res) => {
        const { chatId } = req.params;
        const mensajes = await this.obtenerMensajesUseCase.execute(chatId);
        return res.json(mensajes);
    }

    escucharPorMensajes = async(req, res) => {
        const { chatId } = req.params;
        const callback = (mensaje) => {
            res.json(mensaje);
        };
        return await this.escucharNuevosMensajesUseCase.execute(chatId, callback);
    }

    getChatByUser = async(req, res) => {
        const { idUser } = req.params;

        console.log(idUser);
        const chats = await this.obtenerChatsPorUsuarioUseCase.execute(idUser);
        return res.json(chats);
    }
}

export default new ChatController();