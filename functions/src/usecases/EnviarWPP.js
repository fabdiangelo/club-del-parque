

export class EnviarWPP {
    constructor(WhatsappRepository) {
        this.WhatsappRepository = WhatsappRepository;
    }

    async ejecutar(mensaje, telefono) {


        console.log("DESDE USECASE");
        return await this.WhatsappRepository.enviar(mensaje, telefono);
    }
}