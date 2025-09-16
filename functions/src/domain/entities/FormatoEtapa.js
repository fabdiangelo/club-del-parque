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

    toPlainObject() {
        return {
            id: this.id,
            tipoEtapa: this.tipoEtapa,
            cantidadSets: this.cantidadSets,
            juegosPorSet: this.juegosPorSet,
            cantidadPartidos: this.cantidadPartidos,
            cantidadDeJugadoresIni: this.cantidadDeJugadoresIni,
            cantidadDeJugadoresFin: this.cantidadDeJugadoresFin,
            formatosCampeonatosIDs: this.formatosCampeonatosIDs,
        };
    }
}