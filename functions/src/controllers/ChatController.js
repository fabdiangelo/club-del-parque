
import { ChatRepository } from "../infraestructure/adapters/ChatRepository";
import { CrearChat } from "../usecases/Chat/CrearChat";
import { EnviarMensaje } from "../usecases/Chat/EnviarMensaje";
import { EscucharNuevosMensajes } from "../usecases/Chat/EscucharNuevosMensajes";
import { ObtenerChatPorId } from "../usecases/Chat/ObtenerChatPorId";
import { ObtenerChatsPorUsuario } from "../usecases/Chat/ObtenerChatsPorUsuario";
import { ObtenerMensajes } from "../usecases/Chat/ObtenerMensajes";

class ChatController {
    constructor() {
        this.obtenerChatPorId = new ObtenerChatPorId(new ChatRepository());
        this.enviarMensaje = new EnviarMensaje(new ChatRepository());
        this.obtenerMensajes = new ObtenerMensajes(new ChatRepository());
        this.escucharNuevosMensajes = new EscucharNuevosMensajes(new ChatRepository());
        this.obtenerChatsPorUsuario = new ObtenerChatsPorUsuario(new ChatRepository());
        this.crearChat = new CrearChat(new ChatRepository());
    
    }

    async getChatById(req, res) {
        const { chatId } = req.params;
        const chat = await this.obtenerChatPorId.execute(chatId);
        res.json(chat);
    }

    async crearChat(req, res) {
        const { participantes } = req.body;
        const nuevoChat = await this.crearChat.execute(participantes);
        res.status(201).json(nuevoChat);
    }

    async enviarMensaje(req, res) {
        const { chatId, message } = req.body;
        await this.enviarMensaje.execute(chatId, message);
        res.status(201).send();
    }

    async getMensajes(req, res) {
        const { chatId } = req.params;
        const mensajes = await this.obtenerMensajes.execute(chatId);
        res.json(mensajes);
    }

    async escucharPorMensajes(req, res) {
        const { chatId } = req.params;
        const callback = (mensaje) => {
            res.json(mensaje);
        };
        await this.escucharNuevosMensajes.execute(chatId, callback);
    }

    async getChatByUser(req, res) {
        const { userId } = req.params;
        const chats = await this.obtenerChatsPorUsuario.execute(userId);
        res.json(chats);
    }
}

export default new ChatController();