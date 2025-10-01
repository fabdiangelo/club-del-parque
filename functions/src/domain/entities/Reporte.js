export default class Reporte {
    constructor(id, motivo, descripcion, fecha, estado, mailUsuario, leido) {
        this.id = id;
        this.motivo = motivo;
        this.descripcion = descripcion;
        this.fecha = fecha;
        this.estado = estado;
        this.mailUsuario = this.mailUsuario;
        this.leido = leido;
    }


    toPlainObject() {
        return {
            id: this.id,
            motivo: this.motivo,
            descripcion: this.descripcion,
            fecha: this.fecha,
            estado: this.estado,
            mailUsuario: this.mailUsuario,
            leido: this.leido,
        };
    }
}