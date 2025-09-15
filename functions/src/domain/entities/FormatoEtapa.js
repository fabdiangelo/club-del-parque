export default class FormatoEtapa {
    constructor(id, tipoEtapa, cantidadSets, juegosPorSet, cantidadPartidos, cantidadDeJugadoresIni, cantidadDeJugadoresFin){
        this.id = id;
        this.tipoEtapa = tipoEtapa;
        this.cantidadSets = cantidadSets;
        this.juegosPorSet = juegosPorSet;
        this.cantidadPartidos = cantidadPartidos;
        this.cantidadDeJugadoresIni = cantidadDeJugadoresIni;
        this.cantidadDeJugadoresFin = cantidadDeJugadoresFin;
        this.formatosCampeonatosIDs = [];
    }
}