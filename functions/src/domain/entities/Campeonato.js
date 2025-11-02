export default class Campeonato {
  constructor(
    id,
    nombre,
    descripcion,
    inicio,
    fin,
    ultimaPosicionJugable,
    cantidadJugadores,
    requisitosParticipacion,
    dobles,
    esTenis,
    temporadaID = null,
    tipoDePartido = null,
    deporte = null,
    puntosPorPosicion = null
  ) {
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
    };
    (this.dobles = dobles),
      (this.esTenis = esTenis),
      (this.federadosCampeonatoIDs = []);
    this.etapasIDs = [];
    this.temporadaID = temporadaID;
    this.tipoDePartido = tipoDePartido;
    this.deporte = deporte ? String(deporte).toLowerCase() : null;
    this.puntosPorPosicion = puntosPorPosicion || null;
    // Reglamentos (opcional)
    this.reglamentoUrl = null;
    this.reglamentoPath = null;
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
      temporadaID: this.temporadaID,
      tipoDePartido: this.tipoDePartido,
      deporte: this.deporte,
      puntosPorPosicion: this.puntosPorPosicion,
      reglamentoUrl: this.reglamentoUrl || null,
      reglamentoPath: this.reglamentoPath || null,
    };
  }
}
