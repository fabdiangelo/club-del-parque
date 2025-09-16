export default class FederadoCampeonato {
    constructor(id, puntaje, lugar, federadoID, campeonatoID){
        this.id = id;
        this.puntaje = puntaje;
        this.lugar = lugar;
        this.federadoID = federadoID;
        this.campeonatoID = campeonatoID
    }

    toPlainObject() {
        return {
            id: this.id,
            puntaje: this.puntaje,
            lugar: this.lugar,
            federadoID: this.federadoID,
            campeonatoID: this.campeonatoID,
        };
    }
}