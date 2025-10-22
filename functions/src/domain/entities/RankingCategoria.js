// functions/src/domain/entities/RankingCategoria.js
const CAP_OK = new Set([4, 8, 16, 32, 64, 128, 256]);

export default class RankingCategoria {
  /**
   * @param {object} p
   * @param {string|null} p.id
   * @param {string} p.temporadaID
   * @param {"tenis"|"padel"} p.deporte
   * @param {"singles"|"dobles"} p.tipoDePartido
   * @param {string|null} p.filtroId   // puede ser null (si no aplica filtro)
   * @param {string} p.nombre
   * @param {number} p.capacidad       // 4,8,16,32,64,128,256
   * @param {number} p.orden           // >= 0
   */
  constructor({
    id = null,
    temporadaID,
    deporte,
    tipoDePartido,
    filtroId = null,
    nombre,
    capacidad,
    orden = 0,
  }) {
    const s = (x) => (x == null ? "" : String(x).trim());

    if (!s(temporadaID)) throw new Error("temporadaID obligatorio");
    const dep = s(deporte).toLowerCase();
    if (!["tenis", "padel"].includes(dep)) throw new Error("deporte inválido");
    const tipo = s(tipoDePartido).toLowerCase();
    if (!["singles", "dobles"].includes(tipo))
      throw new Error("tipoDePartido inválido");

    const nm = s(nombre);
    if (!nm) throw new Error("nombre obligatorio");

    const cap = Number(capacidad);
    if (!Number.isInteger(cap) || !CAP_OK.has(cap))
      throw new Error("capacidad inválida (4,8,16,32,64,128,256)");

    const ord = Number(orden);
    if (!Number.isInteger(ord) || ord < 0) throw new Error("orden inválido");

    this.id = id || null;
    this.temporadaID = temporadaID;
    this.deporte = dep; // "tenis" | "padel"
    this.tipoDePartido = tipo; // "singles" | "dobles"
    this.filtroId = filtroId ?? null; // puede ser null
    this.nombre = nm;
    this.capacidad = cap;
    this.orden = ord;

    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  scopeKey() {
    // Útil para agrupar por ámbito
    return [
      String(this.temporadaID).toLowerCase(),
      String(this.deporte).toLowerCase(),
      String(this.tipoDePartido).toLowerCase(),
      String(this.filtroId || "null").toLowerCase(),
    ].join("|");
  }

  toPlainObject() {
    return {
      id: this.id ?? null,
      temporadaID: this.temporadaID,
      deporte: this.deporte,
      tipoDePartido: this.tipoDePartido,
      filtroId: this.filtroId ?? null,
      nombre: this.nombre,
      capacidad: this.capacidad,
      orden: this.orden,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
