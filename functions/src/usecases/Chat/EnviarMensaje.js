

export class EnviarMensaje {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId, nuevoMensaje) {
        return await this.chatRepository.enviarMensaje(chatId, nuevoMensaje);
    }
}