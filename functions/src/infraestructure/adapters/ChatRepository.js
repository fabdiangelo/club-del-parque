import { ChatPort } from "../ports/ChatPort";

export class ChatRepository {
    constructor() {
        this.chatport = new ChatPort();
    }

    async crearChat(nuevoChat) {
        await this.chatport.crearChat(nuevoChat);
    }

    async obtenerMensajes(chatId) {
        return await this.chatport.obtenerMensajes(chatId);
    }

    async enviarMensaje(chatId, nuevoMensaje) {
        await this.chatport.enviarMensaje(chatId, nuevoMensaje);
    }

    async escucharNuevosMensajes(chatId, callback) {
        return this.chatport.escucharNuevosMensajes(chatId, callback);
    }

    async obtenerChatsPorUsuario(userId) {
        return await this.chatport.obtenerChatsDeUsuario(userId);
    }

    async getMensajes(chatId) {
        return await this.chatport.obtenerMensajes(chatId);
    }


}