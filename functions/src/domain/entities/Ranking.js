export default class Ranking {
  constructor(id, temporadaID, usuarioID, tipoDePartido) {
    this.id = id;
    this.temporadaID = temporadaID;
    this.usuarioID = usuarioID;
    this.tipoDePartido = typeof tipoDePartido === "string" ? tipoDePartido : null;
    this.puntos = 0;
  }

  toPlainObject() {
    return {
      id: this.id,
      temporadaID: this.temporadaID,
      usuarioID: this.usuarioID,
      tipoDePartido: this.tipoDePartido,
      puntos: this.puntos,
    };
  }
}
