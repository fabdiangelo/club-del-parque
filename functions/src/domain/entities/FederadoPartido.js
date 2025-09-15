export default class FederadoPartido {
    constructor(id, resultado, puntosRanking, federadoID, partidoID){
        this.id = id;
        this,resultado = resultado;
        this.puntosRanking = puntosRanking;
        this.federadoID = federadoID;
        this.partidoID = partidoID;
        this.horariosLibresIDs = [];
        this.setsIDs = [];
    }
}