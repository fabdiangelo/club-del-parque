export default class Reporte {
    constructor(id, motivo, descripcion, fecha, estado, idUsuario, leido) {
        this.id = id;
        this.motivo = motivo;
        this.descripcion = descripcion;
        this.fecha = fecha;
        this.estado = estado;
        this.idUsuario = idUsuario;
        this.leido = leido;
    }


    toPlainObject() {
        return {
            id: this.id,
            motivo: this.motivo,
            descripcion: this.descripcion,
            fecha: this.fecha,
            estado: this.estado,
            idUsuario: this.idUsuario,
            leido: this.leido,
        };
    }
}