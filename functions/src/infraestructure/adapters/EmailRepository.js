import Email from '../ports/Email.js';

export class EmailRepository {
    constructor() {
        this.email = new Email();
    }

    async enviar(mensaje, destinatario, asunto) {
        console.log("DESDE repository", mensaje, destinatario, asunto);
        return await this.email.enviarEmail(destinatario, asunto, mensaje);
    }
}