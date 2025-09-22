

export class EnviarMail {
    constructor(emailRepository) {
        this.emailRepository = emailRepository;
    }

    async ejecutar(mensaje, destinatario, asunto) {
        return await this.emailRepository.enviar(mensaje, destinatario, asunto);
    }
}
