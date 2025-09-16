export default class Ranking {
    constructor(id, temporadaID, usuarioID){
        this.id = id;
        this.temporadaID = temporadaID;
        this.usuarioID = usuarioID;
        this.puntos = 0;
    }

    toPlainObject() {
        return {
            id: this.id,
            temporadaID: this.temporadaID,
            usuarioID: this.usuarioID,
            puntos: this.puntos,
        };
    }
}