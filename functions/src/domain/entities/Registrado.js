import Usuario from "./Usuario.js";

export default class Registrado extends Usuario{
    constructor (id, email, nombre, apellido, estado, nacimiento, genero) {
        super(id, email, nombre, apellido, estado, nacimiento, genero);
    }

    toPlainObject() {
        return {
            ...super.toPlainObject()
        };
    }
}