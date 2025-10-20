// functions/src/infraestructure/adapters/FederadoRepository.js
import DBConnection from "../ports/DBConnection.js";
import AuthConnection from "../ports/AuthConnection.js";

class FederadoRepository {
  constructor() {
    this.db = new DBConnection();
    this.auth = new AuthConnection();

    // ⚠️ Usamos la colección "usuarios" (no "federados")
    // porque PartidoController busca jugadores ahí:
    // DBConnection.getItem("usuarios", <id>)
    this.collection = "federados";
  }

  /**
   * Normaliza distintos formatos de salida del DBConnection
   * a un array de objetos { id, ...data }.
   */
  static _normalizeResultToArray(res) {
    // 1) Array plano [{ id, ...fields }]
    if (Array.isArray(res)) {
      return res.map((row) => {
        const { id, ...rest } = row || {};
        return { id, ...rest };
      });
    }

    // 2) Firestore-like { docs: [...] }
    if (res && Array.isArray(res.docs)) {
      return res.docs.map((doc) => {
        const data = typeof doc.data === "function" ? doc.data() : doc;
        return { id: doc.id, ...data };
      });
    }

    // 3) Firestore-like snapshot con .forEach
    if (res && typeof res.forEach === "function") {
      const out = [];
      res.forEach((doc) => {
        const data = typeof doc.data === "function" ? doc.data() : doc;
        out.push({ id: doc.id, ...data });
      });
      return out;
    }

    // 4) Forma desconocida
    return [];
  }

  /**
   * Obtiene un federado por ID de documento.
   * Si no existe, intenta buscar por UID (fallback) si tu DBConnection lo permite.
   */
  async getFederadoById(userIdOrUid) {
    // Primero: por ID de documento (lo que usa PartidoController)
    const byId = await this.db.getItem(this.collection, userIdOrUid);
    if (byId) return byId;

    // Fallback opcional: por UID
    // Intentamos varias APIs que tu DBConnection podría exponer.
    if (typeof this.db.findOne === "function") {
      const byUid = await this.db.findOne(this.collection, { uid: userIdOrUid });
      if (byUid) return byUid;
    }

    if (typeof this.db.findMany === "function") {
      const found = await this.db.findMany(this.collection, { uid: userIdOrUid });
      if (Array.isArray(found) && found.length > 0) return found[0];
    }

    // Fallback final: traer todo y filtrar en memoria (menos eficiente)
    if (typeof this.db.getAllItems === "function") {
      const all = FederadoRepository._normalizeResultToArray(
        await this.db.getAllItems(this.collection)
      );
      const byUidMem = all.find((u) => (u?.uid ?? "") === userIdOrUid);
      if (byUidMem) return byUidMem;
    }

    return null;
  }

  /**
   * Devuelve TODOS los federados como objetos planos para API,
   * con el **id de documento** y (si existe) el **uid**.
   * Se filtra por rol === "federado".
   */
  async getAllFederados() {
    // Si tu DBConnection soporta queries, usalas:
    if (typeof this.db.findMany === "function") {
      const rows = await this.db.findMany(this.collection, { rol: "federado" });
      const list = FederadoRepository._normalizeResultToArray(rows).map((row) => {
        const { id, ...data } = row || {};
        // Asegurar campos comunes y no pisar id
        return {
          id,
          uid: data.uid ?? null,
          email: data.email ?? null,
          nombre: data.nombre ?? "",
          apellido: data.apellido ?? "",
          genero: data.genero ?? null,
          estado: data.estado ?? null,
          ...data,
        };
      });

      // (opcional) orden por nombre/apellido
      list.sort((a, b) =>
        `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, "es")
      );
      return list;
    }

    // Si no hay findMany, traemos todo y filtramos en memoria
    const res = await this.db.getAllItems(this.collection);
    const normalized = FederadoRepository._normalizeResultToArray(res);

    const list = normalized
      .filter((u) => (u?.rol ?? "") === "federado")
      .map((row) => {
        const { id, ...data } = row || {};
        return {
          id,
          uid: data.uid ?? null,
          email: data.email ?? null,
          nombre: data.nombre ?? "",
          apellido: data.apellido ?? "",
          genero: data.genero ?? null,
          estado: data.estado ?? null,
          ...data,
        };
      });

    list.sort((a, b) =>
      `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, "es")
    );
    return list;
  }

  /**
   * Guarda/crea un federado en la colección de usuarios (por id).
   */
  async save(federado) {
    const docRef = await this.db.putItem(this.collection, federado, federado.id);
    return docRef?.id || federado.id;
  }

  async update(id, federado) {
    return this.db.updateItem(this.collection, id, federado);
  }

  async agregarSubscripcion(id, subId) {
    console.log("Agregando subscripcion", subId, "al federado", id);
    const federado = await this.db.getItem(this.collection, id);
    if (!federado) throw new Error("Federado no encontrado");
    const subs = Array.isArray(federado.subscripcionesIDs)
      ? federado.subscripcionesIDs
      : [];
    subs.unshift(subId);
    federado.subscripcionesIDs = subs;
    await this.db.putItem(this.collection, federado, id);
  }

  async getCantFederados() {
    // si tu DB permite contar con filtro, mejor; si no, contá filtrando
    if (typeof this.db.count === "function") {
      return this.db.count(this.collection, { rol: "federado" });
    }
    const all = await this.getAllFederados();
    return all.length;
  }
}

export { FederadoRepository };
