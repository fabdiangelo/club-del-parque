

export class CrearChat {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }


    async execute(nuevoChat) {
        await this.chatRepository.crearChat(nuevoChat);
    }
}