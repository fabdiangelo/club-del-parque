export default class Plan {
    constructor(id, tipo, frecuenciaRenovacion){
        this.id = id;
        this.tipo = tipo;
        this.frecuenciaRenovacion = frecuenciaRenovacion;
        this.subscripcionesIDs = [];
    }
}