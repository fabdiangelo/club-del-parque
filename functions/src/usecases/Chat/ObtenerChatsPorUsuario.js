export class ObtenerChatsPorUsuario {

    constructor(chatRepository) {
        this.chatRepository = chatRepository
    }

    async execute(userId) {
        return await this.chatRepository.obtenerChatsPorUsuario(userId);
    }
}