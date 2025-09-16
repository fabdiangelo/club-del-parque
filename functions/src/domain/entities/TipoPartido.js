export default class TipoPartido {
    constructor(id, nombre, descripcion){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.temporadasIDs = [];
        this.partidosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            descripcion: this.descripcion,
            temporadasIDs: this.temporadasIDs,
            partidosIDs: this.partidosIDs,
        };
    }
}