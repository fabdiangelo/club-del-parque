export default class Pago {
    constructor(id, fecha, monto, moneda, descripcion, estado, subscripcionID){
        this.id = id;
        this.fecha = fecha;
        this.monto = monto;
        this.moneda = moneda;
        this.descripcion = descripcion;
        this.estado = estado;
        this.subscripcionID = subscripcionID;
    }

    toPlainObject() {
        return {
            id: this.id,
            fecha: this.fecha,
            monto: this.monto,
            moneda: this.moneda,
            descripcion: this.descripcion,
            estado: this.estado,
            subscripcionID: this.subscripcionID,
        };
    }
}