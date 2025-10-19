// /functions/src/domain/entities/Ranking.js
export default class Ranking {
  constructor(id, temporadaID, usuarioID, tipoDePartido, deporte = null) {
    this.id = id;
    this.temporadaID = temporadaID;
    this.usuarioID = usuarioID;
    this.tipoDePartido = typeof tipoDePartido === "string" ? tipoDePartido : null; // "singles" | "dobles"
    this.deporte = typeof deporte === "string" ? deporte.toLowerCase() : null;     // "tenis" | "padel" | null
    this.puntos = 0;

    // nuevos contadores
    this.partidosGanados = 0;
    this.partidosPerdidos = 0;
    this.partidosAbandonados = 0;
  }

  toPlainObject() {
    return {
      id: this.id,
      temporadaID: this.temporadaID,
      usuarioID: this.usuarioID,
      tipoDePartido: this.tipoDePartido,
      deporte: this.deporte,
      puntos: this.puntos,
      partidosGanados: this.partidosGanados,
      partidosPerdidos: this.partidosPerdidos,
      partidosAbandonados: this.partidosAbandonados,
    };
  }
}
