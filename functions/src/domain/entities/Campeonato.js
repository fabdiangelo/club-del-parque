export default class Campeonato {
    constructor(id, nombre, descripcion, inicio, fin, ultimaPosicionJugable, cantidadJugadores, requisitosParticipacion, dobles, esTenis){
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.inicio = inicio;
        this.fin = fin;
        this.ultimaPosicionJugable = ultimaPosicionJugable;
        this.cantidadJugadores = cantidadJugadores;
        this.requisitosParticipacion = {
            genero: requisitosParticipacion.genero,
            edadDesde: requisitosParticipacion.edadDesde,
            edadHasta: requisitosParticipacion.edadHasta,
            rankingDesde: requisitosParticipacion.rankingDesde,
            rankingHasta: requisitosParticipacion.rankingHasta,
        }
        this.dobles = dobles,
        this.esTenis = esTenis,
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
            cantidadJugadores: this.cantidadJugadores,
            requisitosParticipacion: this.requisitosParticipacion,
            dobles: this.dobles,
            esTenis: this.esTenis,
            federadosCampeonatoIDs: this.federadosCampeonatoIDs,
            etapasIDs: this.etapasIDs,
        };
    }
}