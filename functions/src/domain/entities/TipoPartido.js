export default class TipoPartido {
    constructor(id, nombre, descripcion){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.temporadasIDs = [];
        this.partidosIDs = [];
    }
}