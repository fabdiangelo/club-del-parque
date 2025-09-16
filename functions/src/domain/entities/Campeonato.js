export default class Campeonato {
    constructor(id, nombre, descripcion, inicio, fin, ultimaPosicionJugable, formatoCampeonatoID){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.inicio = inicio;
        this.fin = fin;
        this.ultimaPosicionJugable = ultimaPosicionJugable;
        this.formatoCampeonatoID = formatoCampeonatoID
        this.federadosCampeonatoIDs = [];
        this.etapasIDs = [];
    }

    toPlainObject() {
        return {
            id: this.id,
            nombre: this.nombre,
            descripcion: this.descripcion,
            inicio: this.inicio,
            fin: this.fin,
            ultimaPosicionJugable: this.ultimaPosicionJugable,
            formatoCampeonatoID: this.formatoCampeonatoID,
            federadosCampeonatoIDs: this.federadosCampeonatoIDs,
            etapasIDs: this.etapasIDs,
        };
    }
}