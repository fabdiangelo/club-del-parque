export default class Logro {
    constructor(id, nombre, descripcion, condicion, icono){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.condicion = condicion;
        this.icono = icono;
        this.usuariosIDs = [];
    }
}