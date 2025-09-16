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

    toPlainObject() {
        return {
            id: this.id,
            anio: this.anio,
            inicio: this.inicio,
            fin: this.fin,
            estado: this.estado,
            tipoPartidoID: this.tipoPartidoID,
            rankingsIDs: this.rankingsIDs,
            partidosIDs: this.partidosIDs,
        };
    }
}