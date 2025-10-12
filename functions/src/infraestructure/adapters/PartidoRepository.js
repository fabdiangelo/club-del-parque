import DBConnection from "../ports/DBConnection.js";



export class PartidoRepository {
    constructor() {
        this.db = new DBConnection();
    }


async save(partido) {
  const { temporadaID } = partido;

  const temp = await this.db.getItem("temporadas", temporadaID);
  const cancha = await this.db.getItem("canchas", partido.canchaID);
  if (!temp)   throw new Error("La temporada asociada no existe");
  if (!cancha) throw new Error("La cancha asociada no existe");

  for (const j of partido.jugadores) {
    const jugador = await this.db.getItem("usuarios", j);
    if (!jugador) throw new Error(`El jugador con ID ${j} no existe`);
  }
  for (const j of partido.equipoLocal) {
    const u = await this.db.getItem("usuarios", j);
    if (!u) throw new Error(`El equipo local con ID ${j} no existe`);
  }
  for (const j of partido.equipoVisitante) {
    const u = await this.db.getItem("usuarios", j);
    if (!u) throw new Error(`El equipo visitante con ID ${j} no existe`);
  }

  let createdId;
  if (partido.id) {
    // put with provided id -> DBConnection.putItem returns void
    await this.db.putItem("partidos", partido, partido.id);
    createdId = partido.id;
  } else {
    // put without id -> DBConnection.putItem returns a DocumentReference
    const ref = await this.db.putItem("partidos", partido);
    createdId = ref.id;
  }

  // opcional: guarda el id dentro del doc para consistencia
  try { await this.db.updateItem("partidos", createdId, { id: createdId }); } catch {}

  return createdId;
}

async getById(partidoId) {
  const data = await this.db.getItem("partidos", partidoId); 
  if (!data) return null;
  return { id: partidoId, ...data };
}
    async getAll() {
        return await this.db.getAllItems("partidos");
    }

    async update(partidoId, partido) {
        return await this.db.updateItem("partidos", partidoId, partido);
    }

    async getPartidosPorTemporada(temporadaID) {
        return await this.db.getItemsByField("partidos", "temporadaID", temporadaID);
    }

    async delete(partidoId) {
        return await this.db.deleteItem("partidos", partidoId);
    }

    async getPartidosPorJugador(federadoID) {
        const allPartidos = await this.db.getAllItems("partidos");
        const partidosList = [];

        allPartidos.forEach((doc) => {
            const data = doc.data();
            if (data.federadosPartidoIDs && data.federadosPartidoIDs.includes(federadoID)) {
                partidosList.push({ id: doc.id, ...data });
            }
        });
        return partidosList;
    }
}