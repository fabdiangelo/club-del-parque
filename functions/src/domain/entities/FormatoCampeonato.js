export default class FormatoCampeonato {
    constructor(id, nombre, cantidadJugadores, formatosEtapasIDs){
        this.id = id;
        this.nombre = nombre;
        this.cantidadJugadores = cantidadJugadores;
        this.formatosEtapasIDs = formatosEtapasIDs;
        this.campeonatosIDs = [];
    }
}