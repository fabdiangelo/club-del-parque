
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
        res.json(chat);
    }

    crearChat = async(req, res) => {
        try {

            const { participantes } = req.body;
            const nuevoChat = await this.crearChatUseCase.execute(participantes);
            return res.status(201).json(nuevoChat);
        } catch (error) {
            console.error("Error creando chat:", error);
            return res.status(500).json({ error: "Error creando chat" });
        }

    }

    enviarMensaje = async(req, res) => {
        const { chatId, message } = req.body;
        await this.enviarMensajeUseCase.execute(chatId, message);
        return res.status(201).send();
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
        const { userId } = req.params;
        const chats = await this.obtenerChatsPorUsuarioUseCase.execute(userId);
        return res.json(chats);
    }
}

export default new ChatController();