export default class FederadoCampeonato {
    constructor(id, puntaje, lugar, federadoID, campeonatoID){
        this.id = id;
        this.puntaje = puntaje;
        this.lugar = lugar;
        this.federadoID = federadoID;
        this.campeonatoID = campeonatoID;
        this.etapaID = null;
        this.grupoID = null;
        this.posicion = null;
        this.partidosIDs = [];
        this.invite = null;
    }

    toPlainObject() {
        return {
            id: this.id,
            puntaje: this.puntaje,
            lugar: this.lugar,
            federadoID: this.federadoID,
            campeonatoID: this.campeonatoID,
            etapaID: this.etapaID,
            grupoID: this.grupoID,
            posicion: this.posicion,
            partidosIDs: this.partidosIDs,
            invite: this.invite,
        };
    }
}