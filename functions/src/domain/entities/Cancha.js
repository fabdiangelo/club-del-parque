export default class Cancha{
    constructor(id, nombre){
        this.id = id;
        this.nombre = nombre;
        this.partidosIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            partidosIDs: this.partidosIDs,
        };
    }
}