export default class Notificacion {
    constructor(id, tipo, resumen, fecha, leido, usuarioID){
        this.id = id;
        this.tipo = tipo;
        this.resumen = resumen;
        this.fecha = fecha;
        this.leido = leido;
        this.usuarioID = usuarioID;
    }
}