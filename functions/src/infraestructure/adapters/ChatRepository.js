import { ChatPort } from "../ports/ChatPort.js";

export class ChatRepository {
    constructor() {
        this.chatport = new ChatPort();
    }

    async crearChat(participantes) {
        console.log("ChatRepository - creando chat con participantes:", participantes);
        return await this.chatport.crearChat(participantes);
    }

    async obtenerChatPorId(chatId) {
        return await this.chatport.buscarChatPorId(chatId);
    }

    async obtenerMensajes(chatId) {
        return await this.chatport.obtenerMensajes(chatId);
    }

    async enviarMensaje(chatId, nuevoMensaje) {
        return await this.chatport.enviarMensaje(chatId, nuevoMensaje);
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