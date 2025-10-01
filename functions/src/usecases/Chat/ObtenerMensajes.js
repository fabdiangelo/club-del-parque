
export class ObtenerMensajes {
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }

    async execute(chatId) {
        console.log("ObtenerMensajes - execute llamado con chatId:", chatId);
        return await this.chatRepository.obtenerMensajes(chatId);
    }
}