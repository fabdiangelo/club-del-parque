export default class Ranking {
  constructor(
    id,
    temporadaID,
    usuarioID,
    tipoDePartido,
    deporte = null,
    { filtroId = null, filtrosSnapshot = null } = {}
  ) {
    this.id = id;
    this.temporadaID = temporadaID;
    this.usuarioID = usuarioID;
    this.tipoDePartido = typeof tipoDePartido === "string" ? tipoDePartido : null; // "singles" | "dobles"
    this.deporte = typeof deporte === "string" ? deporte.toLowerCase() : null;     // "tenis" | "padel" | null

    // relación con Filtros (opcional)
    this.filtroId = filtroId ? String(filtroId) : null;
    // snapshot desnormalizado { modalidad:{nombre}, genero:{nombre}, edadMin, ... }
    this.filtrosSnapshot = filtrosSnapshot && typeof filtrosSnapshot === "object" ? filtrosSnapshot : null;

    this.puntos = 0;
    this.partidosGanados = 0;
    this.partidosPerdidos = 0;
    this.partidosAbandonados = 0;

    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  toPlainObject() {
    return {
      id: this.id,
      temporadaID: this.temporadaID,
      usuarioID: this.usuarioID,
      tipoDePartido: this.tipoDePartido,
      deporte: this.deporte,
      filtroId: this.filtroId,
      filtrosSnapshot: this.filtrosSnapshot,
      puntos: this.puntos,
      partidosGanados: this.partidosGanados,
      partidosPerdidos: this.partidosPerdidos,
      partidosAbandonados: this.partidosAbandonados,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
