export default class FormatoEtapa {
    constructor(id, tipoEtapa, cantidadSets, juegosPorSet, permitirEmpate){
        this.id = id;
        this.tipoEtapa = tipoEtapa;
        this.cantidadSets = cantidadSets;
        this.juegosPorSet = juegosPorSet;
        this.permitirEmpate = permitirEmpate;
    }

    toPlainObject() {
        return {
            id: this.id,
            tipoEtapa: this.tipoEtapa,
            cantidadSets: this.cantidadSets,
            juegosPorSet: this.juegosPorSet,
            permitirEmpate: this.permitirEmpate,
        };
    }
}