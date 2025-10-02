export default class Chat {


    constructor(id, participantes, mensajes) {
        this.id = id;
        this.mensajes = mensajes;
        this.participantes = participantes;
        this.fechaEmision = new Date().toISOString();
    }

    toPlainObject() {
        return {
            id: this.id,
            participantes: this.participantes,
            mensajes: this.mensajes
        }
    }
}