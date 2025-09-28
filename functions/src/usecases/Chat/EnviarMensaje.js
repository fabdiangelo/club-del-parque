

export class EnviarMensaje {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId, nuevoMensaje) {
        await this.chatRepository.enviarMensaje(chatId, nuevoMensaje);
    }
}