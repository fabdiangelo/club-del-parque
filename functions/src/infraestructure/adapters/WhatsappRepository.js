import WPP from '../ports/WPP.js';

export class WhatsappRepository {
    constructor() {
    }

    async enviar(mensaje, telefono) {
        const wpp = new WPP();
        console.log("DESDE repository", mensaje, telefono);
        return await wpp.enviarWPP(mensaje, telefono);
    }
}
