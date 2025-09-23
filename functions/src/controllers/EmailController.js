import {EnviarMail}  from '../usecases/EnviarMail.js';
import { EmailRepository } from '../infraestructure/adapters/EmailRepository.js';

class EmailController {
    constructor() {
        this.enviarMail = new EnviarMail(new EmailRepository());
    }


    async enviar(req, res) {
        const { mensaje, destinatario, asunto } = req.body;

        if(!mensaje || !destinatario || !asunto) {
            return res.status(400).send({ success: false, message: "Faltan parámetros obligatorios" });
        }
        console.log("CONTROLLER", mensaje, destinatario, asunto);

        try {
            const resultado = await this.enviarMail.ejecutar(mensaje, destinatario, asunto);
            res.status(200).send({ success: true, resultado });
        } catch (error) {
            console.error("Error al enviar el email:", error);
            res.status(500).send({ success: false, message: "Error al enviar el email", error: error.message });
        }
    }
}

export default new EmailController();