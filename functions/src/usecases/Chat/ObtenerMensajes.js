
export class ObtenerMensajes {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId) {
        return await this.chatRepository.obtenerMensajes(chatId);
    }
}