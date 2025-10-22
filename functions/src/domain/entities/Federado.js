// domain/entities/Federado.js
import Usuario from "./Usuario.js";

export default class Federado extends Usuario {
  /**
   * @param {string} id
   * @param {string} email
   * @param {string} nombre
   * @param {string} apellido
   * @param {"activo"|"inactivo"} estado
   * @param {string|Date} nacimiento
   * @param {string} genero
   * @param {string|null} categoriaId  // puede ser null
   */
  constructor(id, email, nombre, apellido, estado, nacimiento, genero, categoriaId = null) {
    super(id, email, nombre, apellido, estado, nacimiento, genero);

    this.chatsIDs = [];
    this.subscripcionesIDs = [];
    this.federadoCampeonatosIDs = [];
    this.federadoPartidosIDs = [];
    this.rankingsIDs = [];
    this.logrosIDs = [];
    this.validoHasta = null;

    this.rol = "federado";
    this.categoriaId = categoriaId; // nullable
  }

  toPlainObject() {
    return {
      ...super.toPlainObject(),
      chatsIDs: this.chatsIDs,
      subscripcionesIDs: this.subscripcionesIDs,
      federadoCampeonatosIDs: this.federadoCampeonatosIDs,
      federadoPartidosIDs: this.federadoPartidosIDs,
      rankingsIDs: this.rankingsIDs,
      logrosIDs: this.logrosIDs,
      validoHasta: this.validoHasta,
      // asegurar campos críticos presentes en Firestore:
      rol: this.rol,
      categoriaId: this.categoriaId ?? null,
    };
  }
}
