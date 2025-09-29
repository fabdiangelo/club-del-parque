

export class CrearChat {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }


    async execute(nuevoChat) {
        return await this.chatRepository.crearChat(nuevoChat);
    }
}