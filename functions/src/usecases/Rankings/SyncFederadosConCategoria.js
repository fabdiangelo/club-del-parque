// usecases/Rankings/SyncFederadosConCategoria.js
import GetAllFederados from "../Usuarios/getAllFederados.js";
import EnsureRankingForFederado from "./EnsureRankingForFederado.js";

export default class SyncFederadosConCategoria {
  static async execute({ temporadaID, deporte, tipoDePartido, filtroId = null }) {
    if (!temporadaID) throw new Error("temporadaID obligatorio");
    const dep = String(deporte || "").toLowerCase();
    const tipo = String(tipoDePartido || "").toLowerCase();
    if (!dep || !tipo) throw new Error("deporte y tipoDePartido obligatorios");

    const federados = await GetAllFederados.execute();
    let created = 0, touched = 0;

    for (const f of federados || []) {
      const cat = f?.categoriaId ?? null;
      if (!cat) continue;
      const before = await EnsureRankingForFederado.execute({
        federadoId: f.id,
        temporadaID,
        deporte: dep,
        tipoDePartido: tipo,
        filtroId: filtroId ?? null,
        categoriaId: cat
      });
      if (before?.createdAt && before?.updatedAt && before.createdAt === before.updatedAt) created++;
      else touched++;
    }

    return { ok: true, created, touched };
  }
}
