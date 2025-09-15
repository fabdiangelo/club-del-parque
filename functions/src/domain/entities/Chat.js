export default class Chat {
    constructor (id, usuariosIDs){
        this.id = id;
        this.usuariosIDs = usuariosIDs;
        this.mensajesIDs = [];
    }
}