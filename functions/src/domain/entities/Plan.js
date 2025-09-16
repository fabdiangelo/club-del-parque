export default class Plan {
    constructor(id, tipo, frecuenciaRenovacion){
        this.id = id;
        this.tipo = tipo;
        this.frecuenciaRenovacion = frecuenciaRenovacion;
        this.subscripcionesIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            tipo: this.tipo,
            frecuenciaRenovacion: this.frecuenciaRenovacion,
            subscripcionesIDs: this.subscripcionesIDs,
        };
    }
}