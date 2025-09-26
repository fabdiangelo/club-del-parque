import Usuario from "./Usuario.js";

export default class Administrador extends Usuario{
    constructor (id, email, nombre, apellido, estado, nacimiento, genero, superAdmin) {
        super(id, email, nombre, apellido, estado, nacimiento, genero);
        this.superAdmin = superAdmin;
        this.BlogsIDs = [];
        this.ChatsIDs = [];
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
            rol: this.rol,
            superAdmin: this.superAdmin,
            BlogsIDs: this.BlogsIDs,
            ChatsIDs: this.ChatsIDs
        };
    }
}