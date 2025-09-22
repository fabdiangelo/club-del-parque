
import { WhatsappRepository } from '../infraestructure/adapters/WhatsappRepository.js';
import { EnviarWPP } from '../usecases/EnviarWPP.js';


class SendWhatsappController {
    constructor() {
        this.enviarWPP = new EnviarWPP(new WhatsappRepository());
    }

    enviarMensaje = (req, res) => {
        const { mensaje, telefono } = req.body;

        console.log(mensaje, telefono);
        this.enviarWPP.ejecutar(mensaje, telefono)
            .then(() => res.status(200).send('Mensaje enviado'))
            .catch((error) => res.status(500).send(error.message));
    }
}

export default new SendWhatsappController();