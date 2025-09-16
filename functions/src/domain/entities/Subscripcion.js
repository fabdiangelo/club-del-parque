export default class Subscripcion {
    constructor(id, fechaInicio, fechaFin, federadoID, planID){
        this.id = id;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.federadoID = federadoID;
        this.planID = planID;
        this.pagoID = null;
    }

    toPlainObject() {
        return {
            id: this.id,
            fechaInicio: this.fechaInicio,
            fechaFin: this.fechaFin,
            federadoID: this.federadoID,
            planID: this.planID,
            pagoID: this.pagoID,
        };
    }
}