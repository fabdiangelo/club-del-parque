export default class Logro {
    constructor(id, nombre, descripcion, condicion, icono){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.condicion = condicion;
        this.icono = icono;
        this.usuariosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            descripcion: this.descripcion,
            condicion: this.condicion,
            icono: this.icono,
            usuariosIDs: this.usuariosIDs,
        };
    }
}