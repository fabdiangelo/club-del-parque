export default class Set {
    constructor(id, federadosIDs, PartidoID){
        this.id = id;
        this.federadosIDs = federadosIDs;
        this.PartidoID = PartidoID;
    }

    toPlainObject() {
        return {
            id: this.id,
            federadosIDs: this.federadosIDs,
            PartidoID: this.PartidoID,
        };
    }
}