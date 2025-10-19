export default class FederadoCampeonato {
    constructor(id, puntaje, lugar, federadoID, campeonatoID){
        this.id = id;
        this.puntaje = puntaje;
        this.lugar = lugar;
        this.federadoID = federadoID;
        this.campeonatoID = campeonatoID;
        // Asociaciones dentro del campeonato
        this.etapaID = null; // id de la etapa a la que pertenece
        this.grupoID = null; // id del grupo si aplica
        this.posicion = null; // posición dentro del grupo/etapa
        this.partidosIDs = []; // ids de partidos asociados
            // Invitaciones (para dobles)
            this.invite = null; // { to: inviteeUid, estado: 'pendiente'|'aceptada'|'expirada', fechaEnvio, fechaAceptacion }
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