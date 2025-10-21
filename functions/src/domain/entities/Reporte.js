export default class Reporte {
  constructor(id, motivo, descripcion, fecha, estado, mailUsuario, leido, tipo, partidoId = null) {
    this.id = id;
    this.motivo = motivo;
    this.descripcion = descripcion;
    this.fecha = fecha;
    this.estado = estado;
    this.mailUsuario = mailUsuario;
    this.leido = leido;
    this.tipo = tipo;         
    this.partidoId = partidoId;
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
      partidoId: this.partidoId, 
    };
  }
}
