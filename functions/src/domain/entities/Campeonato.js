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
}