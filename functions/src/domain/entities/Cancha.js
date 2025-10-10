export default class Cancha{
    constructor(id, nombre){
        this.id = id;
        this.nombre = nombre;
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
        };
    }
}