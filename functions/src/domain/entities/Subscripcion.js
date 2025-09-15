export default class Subscripcion {
    constructor(id, fechaInicio, fechaFin, federadoID, planID){
        this.id = id;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.federadoID = federadoID;
        this.planID = planID;
        this.pagoID = null;
    }
}