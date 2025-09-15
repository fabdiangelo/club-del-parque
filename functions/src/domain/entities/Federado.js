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
}