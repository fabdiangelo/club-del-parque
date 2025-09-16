export default class FormatoCampeonato {
    constructor(id, nombre, cantidadJugadores, formatosEtapasIDs){
        this.id = id;
        this.nombre = nombre;
        this.cantidadJugadores = cantidadJugadores;
        this.formatosEtapasIDs = formatosEtapasIDs;
        this.campeonatosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            cantidadJugadores: this.cantidadJugadores,
            formatosEtapasIDs: this.formatosEtapasIDs,
            campeonatosIDs: this.campeonatosIDs,
        };
    }
}