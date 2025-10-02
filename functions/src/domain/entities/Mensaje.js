export default class Mensaje {
    constructor (id, contenido, timestamp, usuario){
        this.id = id;
        this.contenido = contenido;
        this.timestamp = timestamp;
        this.usuario = usuario;
    }

    toPlainObject() {
        return {
            id: this.id,
            contenido: this.contenido,
            timestamp: this.timestamp,
            usuario: this.usuario,
        };
    }
}