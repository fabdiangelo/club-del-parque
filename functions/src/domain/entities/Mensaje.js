export default class Mensaje {
    constructor (id, contenido, timestamp, emisorID){
        this.id = id;
        this.contenido = contenido;
        this.timestamp = timestamp;
        this.emisorID = emisorID;
    }
}