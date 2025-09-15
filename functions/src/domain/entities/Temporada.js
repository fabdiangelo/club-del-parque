export default class Temporada {
    constructor(id, anio, inicio, fin, estado, tipoPartidoID){
        this.id = id;
        this.anio = anio;
        this.inicio = inicio;
        this.fin = fin;
        this.estado = estado;
        this.tipoPartidoID = tipoPartidoID;
        this.rankingsIDs = [];
        this.partidosIDs = [];
    }
}