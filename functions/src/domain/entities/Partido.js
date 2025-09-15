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
}