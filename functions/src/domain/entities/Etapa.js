export default class Etapa {
    constructor(id, nombre, campeonatoID, partidosIDs){
        this.id = id;
        this.nombre = nombre;
        this.campeonatoID = campeonatoID;
        this.partidosIDs = partidosIDs;
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            campeonatoID: this.campeonatoID,
            partidosIDs: this.partidosIDs,
        };
    }
}