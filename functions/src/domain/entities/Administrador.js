import Usuario from "./Usuario.js";

export default class Administrador extends Usuario{
    constructor (id, email, nombre, apellido, estado, nacimiento, genero, superAdmin) {
        super(id, email, nombre, apellido, estado, nacimiento, genero, "administrador");
        this.superAdmin = superAdmin;
        this.BlogsIDs = [];
        this.ChatsIDs = [];
    }

    toPlainObject() {
        return {
            ...super.toPlainObject(),
            superAdmin: this.superAdmin,
            BlogsIDs: this.BlogsIDs,
            ChatsIDs: this.ChatsIDs
        };
    }
}