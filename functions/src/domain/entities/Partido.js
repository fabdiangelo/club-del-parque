export default class Partido {
  constructor(
    id,
    timestamp,
    estado,
    tipoPartido,
    temporadaID,
    canchaID,
    etapa,
    jugadores,
    equipoLocal,
    equipoVisitante,
    resultado,
    ganadores = [],
    deporte = null
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.estado = estado;
    this.tipoPartido = tipoPartido;
    this.temporadaID = temporadaID;
    this.canchaID = canchaID;
    this.resultado = resultado;
    this.etapa = etapa;
    this.jugadores = jugadores;
    this.equipoLocal = equipoLocal;
    this.equipoVisitante = equipoVisitante;
    this.ganadores = ganadores;
    this.deporte = typeof deporte === "string" ? deporte.toLowerCase() : null;
  }

  toPlainObject() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      estado: this.estado,
      tipoPartido: this.tipoPartido,
      temporadaID: this.temporadaID,
      canchaID: this.canchaID,
      etapa: this.etapa,
      jugadores: this.jugadores,
      equipoLocal: this.equipoLocal,
      equipoVisitante: this.equipoVisitante,
      resultado: this.resultado,
      ganadores: this.ganadores,
      deporte: this.deporte, // ← NUEVO
    };
  }
}
