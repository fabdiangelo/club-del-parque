import Usuario from "./Usuario.js";

export default class Federado extends Usuario{
    constructor (id, email, nombre, apellido, estado, nacimiento, genero) {
        super(id, email, nombre, apellido, estado, nacimiento, genero);
        this.chatsIDs = [];
        this.subscripcionesIDs = []
        this.federadoCampeonatosIDs = [];
        this.federadoPartidosIDs = [];
        this.rankingsIDs = [];
        this.logrosIDs = [];
        this.validoHasta = null;
        this.rol = "federado";
    }

    toPlainObject() {
        return {
            ...super.toPlainObject(),
            chatsIDs: this.chatsIDs,
            subscripcionesIDs: this.subscripcionesIDs,
            federadoCampeonatosIDs: this.federadoCampeonatosIDs,
            federadoPartidosIDs: this.federadoPartidosIDs,
            rankingsIDs: this.rankingsIDs,
            logrosIDs: this.logrosIDs,
            validoHasta: this.validoHasta,
        };
    }
}