export default class Etapa {
    constructor(id, nombre, campeonatoID, tipoEtapa, cantidadSets, juegosPorSet, permitirEmpate, cantidadDeJugadoresIni, cantidadDeJugadoresFin, fechaFin, grupos = null, rondas = null){
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
        this.grupos = grupos;
        this.rondas = rondas;
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
            grupos: this.grupos, 
            rondas: this.rondas, 
        };
    }
}