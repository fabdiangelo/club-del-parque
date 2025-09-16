export default class Partido {
    constructor(id, timestamp, estado, tipoPartidoID, temporadaID, canchaID, etapaID, federadosPartidoIDs){
        this.id = id;
        this.timestamp = timestamp;
        this.estado = estado;
        this.tipoPartidoID = tipoPartidoID;
        this.temporadaID = temporadaID;
        this.canchaID = canchaID;
        this.etapaID = etapaID;
        this.federadosPartidoIDs = federadosPartidoIDs;
    }

    toPlainObject() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            estado: this.estado,
            tipoPartidoID: this.tipoPartidoID,
            temporadaID: this.temporadaID,
            canchaID: this.canchaID,
            etapaID: this.etapaID,
            federadosPartidoIDs: this.federadosPartidoIDs,
        };
    }
}