import Modalidad from "./Modalidad.js";
import Genero from "./Genero.js";

export default class Filtros {
  constructor({ modalidad, genero, edadMin = null, edadMax = null, pesoMin = null, pesoMax = null }) {
    // Acepta strings o objetos con {nombre}
    const mod = typeof modalidad === "string" ? { nombre: modalidad } : modalidad;
    const gen = typeof genero === "string" ? { nombre: genero } : genero;

    this.modalidad = new Modalidad(mod?.nombre);
    this.genero = new Genero(gen?.nombre);

    if (edadMin !== null && !Number.isInteger(edadMin)) throw new Error("edadMin debe ser entero o null");
    if (edadMax !== null && !Number.isInteger(edadMax)) throw new Error("edadMax debe ser entero o null");
    if (edadMin !== null && edadMax !== null && edadMin > edadMax) throw new Error("edadMin no puede ser mayor que edadMax");

    if (pesoMin !== null && isNaN(pesoMin)) throw new Error("pesoMin debe ser número o null");
    if (pesoMax !== null && isNaN(pesoMax)) throw new Error("pesoMax debe ser número o null");
    if (pesoMin !== null && pesoMax !== null && pesoMin > pesoMax) throw new Error("pesoMin no puede ser mayor que pesoMax");

    this.edadMin = edadMin;
    this.edadMax = edadMax;
    this.pesoMin = pesoMin;
    this.pesoMax = pesoMax;
  }

  toPlainObject() {
    return {
      modalidad: this.modalidad.toPlainObject(),   // { nombre }
      genero: this.genero.toPlainObject(),         // { nombre }
      edadMin: this.edadMin,
      edadMax: this.edadMax,
      pesoMin: this.pesoMin,
      pesoMax: this.pesoMax,
    };
  }
}
