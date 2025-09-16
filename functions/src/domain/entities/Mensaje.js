export default class Mensaje {
    constructor (id, contenido, timestamp, emisorID){
        this.id = id;
        this.contenido = contenido;
        this.timestamp = timestamp;
        this.emisorID = emisorID;
    }

    toPlainObject() {
        return {
            id: this.id,
            contenido: this.contenido,
            timestamp: this.timestamp,
            emisorID: this.emisorID,
        };
    }
}