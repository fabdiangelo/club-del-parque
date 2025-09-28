

export class EscucharNuevosMensajes {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId, callback) {
        return await this.chatRepository.escucharNuevosMensajes(chatId, callback);
    }
}