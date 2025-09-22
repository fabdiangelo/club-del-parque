import Email from '../ports/Email.js';

export class EmailRepository {
    constructor() {
    }

    async enviar(mensaje, destinatario, asunto) {
        const email = new Email();
        console.log("DESDE repository", mensaje, destinatario, asunto);
        return await email.enviarEmail(destinatario, asunto, mensaje);
    }
}