import Usuario from "./Usuario.js";

export default class Registrado extends Usuario{
    constructor (id, email, nombre, apellido, estado, nacimiento, genero) {
        super(id, email, nombre, apellido, estado, nacimiento, genero);
    }

    toPlainObject() {
        return {
            id: this.id,
            email: this.email,
            nombre: this.nombre,
            apellido: this.apellido,
            estado: this.estado,
            nacimiento: this.nacimiento,
            genero: this.genero,
        };
    }
}