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
    }

    toPlainObject() {
        return {
            id: this.id,
            email: this.email,
            nombre: this.nombre,
            apellido: this.apellido,
            estado: this.estado,
            nacimiento: this.nacimiento,
            genero: this.genero,
            rol: this.rol,
            chatsIDs: this.chatsIDs,
            subscripcionesIDs: this.subscripcionesIDs,
            federadoCampeonatosIDs: this.federadoCampeonatosIDs,
            federadoPartidosIDs: this.federadoPartidosIDs,
            rankingsIDs: this.rankingsIDs,
            logrosIDs: this.logrosIDs,
        };
    }
}