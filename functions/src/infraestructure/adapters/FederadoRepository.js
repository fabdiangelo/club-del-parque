// infraestructure/adapters/FederadoRepository.js
import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

/**
 * Repositorio para la colección "federados".
 * - Soporta distintos backends a través de DBConnection (Firestore/Mock/etc).
 * - Expone helpers útiles (exists, create, upsert, setCategoria, findByUid).
 */
class FederadoRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();
    this.collection = "federados";
  }

  /* -------------------------- utils -------------------------- */

  static _docToObj(doc) {
    if (!doc) return null;
    // Firestore: doc.id + doc.data()
    if (doc.id && typeof doc.data === "function") {
      const data = doc.data() || {};
      return { id: doc.id, ...data };
    }
    // Plain object con id embebido
    if (doc.id && typeof doc === "object") return doc;
    return null;
  }

  static _normalizeResultToArray(res) {
    if (Array.isArray(res)) {
      return res.map((row) => {
        const { id, ...rest } = row || {};
        return { id, ...rest };
      });
    }
    if (res && Array.isArray(res.docs)) {
      return res.docs.map((doc) => {
        const data = typeof doc.data === "function" ? doc.data() : {};
        return { id: doc.id, ...data };
      });
    }
    if (res && typeof res.forEach === "function") {
      const out = [];
      res.forEach((doc) => {
        const data = typeof doc.data === "function" ? doc.data() : {};
        out.push({ id: doc.id, ...data });
      });
      return out;
    }
    return [];
  }

  static _asFederadoShape(row) {
    if (!row) return null;
    const { id, ...data } = row;
    return {
      id,
      uid: data.uid ?? null,
      email: data.email ?? null,
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      genero: data.genero ?? null,
      estado: data.estado ?? null,
      rol: data.rol || "federado",
      ...data,
    };
  }

  /* ------------------------ lecturas ------------------------- */

  /**
   * Busca un federado por docId o por uid (fallback).
   * @param {string} userIdOrUid
   * @returns {Promise<object|null>}
   */
  async getFederadoById(userIdOrUid) {
    // 1) por docId directo
    const byId = await this.db.getItem(this.collection, userIdOrUid);
    if (byId) return FederadoRepository._asFederadoShape(byId);

    // 2) por uid con findOne (si existe)
    if (typeof this.db.findOne === "function") {
      const byUid = await this.db.findOne(this.collection, { uid: userIdOrUid });
      if (byUid) return FederadoRepository._asFederadoShape(byUid);
    }

    // 3) por uid con findMany (si existe)
    if (typeof this.db.findMany === "function") {
      const found = await this.db.findMany(this.collection, { uid: userIdOrUid });
      if (Array.isArray(found) && found.length > 0) {
        return FederadoRepository._asFederadoShape(found[0]);
      }
    }

    // 4) como último recurso, traer todo y filtrar en memoria
    if (typeof this.db.getAllItems === "function") {
      const all = FederadoRepository._normalizeResultToArray(
        await this.db.getAllItems(this.collection)
      );
      const byUidMem = all.find((u) => (u?.uid ?? "") === userIdOrUid);
      if (byUidMem) return FederadoRepository._asFederadoShape(byUidMem);
    }

    return null;
  }

  /**
   * Devuelve true si existe el documento (por docId) en "federados".
   * @param {string} id
   */
  async exists(id) {
    try {
      const doc = await this.db.getItem(this.collection, id);
      return !!doc;
    } catch {
      return false;
    }
  }

  /**
   * Atajo común para buscar por uid (no docId).
   * @param {string} uid
   */
  async findByUid(uid) {
    if (!uid) return null;
    return this.getFederadoById(uid);
  }

  async getAllFederados() {
    let raw = [];
    if (typeof this.db.findMany === "function") {
      raw = FederadoRepository._normalizeResultToArray(
        await this.db.findMany(this.collection, {})
      );
    } else {
      raw = FederadoRepository._normalizeResultToArray(
        await this.db.getAllItems(this.collection)
      );
    }

    const list = raw.map(FederadoRepository._asFederadoShape);

    list.sort((a, b) =>
      `${a?.nombre || ""} ${a?.apellido || ""}`.localeCompare(
        `${b?.nombre || ""} ${b?.apellido || ""}`,
        "es"
      )
    );
    return list;
  }

  /* -------------------- escrituras básicas ------------------- */

  /**
   * Crea un documento (fail si existe).
   */
  async create(id, data) {
    if (!id) throw new Error("create: falta id");
    const exists = await this.exists(id);
    if (exists) throw new Error("El federado ya existe");
    await this.db.putItem(this.collection, { ...data, rol: data?.rol || "federado" }, id);
    return id;
  }

  /**
   * Upsert (merge: true): crea si no existe, actualiza si existe.
   */
  async upsert(id, data) {
    if (!id) throw new Error("upsert: falta id");
    // putItem debe comportarse como set(merge:true) en tu DBConnection;
    // si no lo hace, podés cambiar a updateItem con fallback a putItem.
    await this.db.putItem(this.collection, { ...data, rol: data?.rol || "federado" }, id);
    return id;
  }

  /**
   * Update "puro": falla si no existe (para comportamiento Firestore-like).
   */
  async update(id, data) {
    if (!id) throw new Error("update: falta id");
    return this.db.updateItem(this.collection, id, data);
  }

  /**
   * Save alias (mantiene compat con tu código legado).
   * set/merge por defecto.
   */
  async save(federado) {
    if (!federado?.id) throw new Error("save: falta federado.id");
    const docRef = await this.db.putItem(this.collection, federado, federado.id);
    return docRef?.id || federado.id;
  }

  /* ----------------- campos específicos (dominio) ------------- */

  /**
   * Setea la categoría del federado. Acepta `null` para quitarla.
   * @param {string} id
   * @param {string|null} categoriaId
   * @returns {Promise<{id: string, categoriaId: string|null}>}
   */
async setCategoria(id, categoriaId) {
  if (!id) throw new Error("setCategoria: falta id");
  const payload = { categoriaId: categoriaId ?? null };

  // 1) Si tu DB expone updateItem, úsalo (patch real, no borra nada)
  if (typeof this.db.updateItem === "function") {
    await this.db.updateItem(this.collection, id, payload);
    return { id, categoriaId: payload.categoriaId };
  }

  // 2) Fallback MERGE manual: leo el doc, mezclo y escribo completo
  const current = (await this.db.getItem(this.collection, id)) || {};
  const next = { ...current, ...payload };
  await this.db.putItem(this.collection, next, id); // aunque sea un set "duro", ya va mergeado
  return { id, categoriaId: next.categoriaId ?? null };
}
// infraestructure/adapters/FederadoRepository.js
async updatePartial(id, data) {
  if (!id) throw new Error("updatePartial: falta id");
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (typeof this.db.updateItem === "function") {
    return this.db.updateItem(this.collection, id, clean);
  }

  const current = (await this.db.getItem(this.collection, id)) || {};
  const next = { ...current, ...clean };
  return this.db.putItem(this.collection, next, id);
}

  /**
   * Azúcar sintáctico para quitar la categoría.
   */
  async removeCategoria(id) {
    return this.setCategoria(id, null);
  }

  /**
   * Agrega una subscripción al principio del array `subscripcionesIDs`.
   */
  async agregarSubscripcion(id, subId) {
    console.log("Agregando subscripcion", subId, "al federado", id);
    const federado = await this.db.getItem(this.collection, id);
    if (!federado) throw new Error("Federado no encontrado");
    const subs = Array.isArray(federado.subscripcionesIDs)
      ? federado.subscripcionesIDs
      : [];
    subs.unshift(subId);
    federado.subscripcionesIDs = subs;
    await this.db.putItem(this.collection, federado, id); // merge
  }

  /* -------------------- agregados/consultas ------------------- */

  async getCantFederados() {
    if (typeof this.db.count === "function") {
      return this.db.count(this.collection, {}); // todo
    }
    const all = await this.getAllFederados();
    return all.length;
  }
}

export { FederadoRepository };
export default FederadoRepository;
