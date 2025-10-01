export default class Reporte {
    constructor(id, motivo, descripcion, fecha, estado, mailUsuario, leido, tipo) {
        this.id = id;
        this.motivo = motivo;
        this.descripcion = descripcion;
        this.fecha = fecha;
        this.estado = estado;
        this.mailUsuario = mailUsuario;
        this.leido = leido;
        this.tipo = tipo; // 'reporte_bug' o 'solicitud_federacion'
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
            tipo: this.tipo,
        };
    }
}