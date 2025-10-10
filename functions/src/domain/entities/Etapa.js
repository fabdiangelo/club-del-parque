export default class Etapa {
    constructor(id, nombre, campeonatoID, cantidadDeJugadoresIni, cantidadDeJugadoresFin, fechaFin, formatoEtapaId){
        this.id = id;
        this.nombre = nombre;
        this.campeonatoID = campeonatoID;
        this.cantidadDeJugadoresIni = cantidadDeJugadoresIni;
        this.cantidadDeJugadoresFin = cantidadDeJugadoresFin;
        this.fechaFin = fechaFin;
        this.formatoEtapaId = formatoEtapaId;
        this.partidosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            campeonatoID: this.campeonatoID,
            partidosIDs: this.partidosIDs,
            cantidadDeJugadoresIni: this.cantidadDeJugadoresIni,
            cantidadDeJugadoresFin: this.cantidadDeJugadoresFin,
            fechaFin: this.fechaFin,
            formatoEtapaId: this.formatoEtapaId,
        };
    }
}