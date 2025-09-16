export default class Chat {
    constructor (id, usuariosIDs){
        this.id = id;
        this.usuariosIDs = usuariosIDs;
        this.mensajesIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            usuariosIDs: this.usuariosIDs,
            mensajesIDs: this.mensajesIDs,
        };
    }
}