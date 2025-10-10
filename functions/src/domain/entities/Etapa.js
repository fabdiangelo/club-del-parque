export default class Etapa {
    constructor(id, nombre, campeonatoID, tipoEtapa, cantidadSets, juegosPorSet, permitirEmpate, cantidadDeJugadoresIni, cantidadDeJugadoresFin, fechaFin){
        this.id = id;
        this.nombre = nombre;
        this.campeonatoID = campeonatoID;
        this.tipoEtapa = tipoEtapa;
        this.cantidadSets = cantidadSets;
        this.juegosPorSet = juegosPorSet;
        this.permitirEmpate = permitirEmpate;
        this.cantidadDeJugadoresIni = cantidadDeJugadoresIni;
        this.cantidadDeJugadoresFin = cantidadDeJugadoresFin;
        this.fechaFin = fechaFin;
        this.partidosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            campeonatoID: this.campeonatoID,
            tipoEtapa: this.tipoEtapa,
            cantidadSets: this.cantidadSets,
            juegosPorSet: this.juegosPorSet,
            permitirEmpate: this.permitirEmpate,
            partidosIDs: this.partidosIDs,
            cantidadDeJugadoresIni: this.cantidadDeJugadoresIni,
            cantidadDeJugadoresFin: this.cantidadDeJugadoresFin,
            fechaFin: this.fechaFin,
        };
    }
}