

export class ObtenerChatPorId {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId) {
        return await this.chatRepository.obtenerChatPorId(chatId);
    }
}