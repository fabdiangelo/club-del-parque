export default class HorarioLibre {
    constructor(id, inicio, fin, federadoPartidoID){
        this.id = id;
        this.incio = inicio;
        this.fin = fin;
        this.federadoPartidoID = federadoPartidoID;
    }

    toPlainObject() {
        return {
            id: this.id,
            inicio: this.inicio,
            fin: this.fin,
            federadoPartidoID: this.federadoPartidoID,
        };
    }
}