import Temporada from "../../domain/entities/Temporada.js";

export default function CreateAndActivateTemporada(temporadaRepo) {
  return async function execute({ anio, inicio, fin }) {
    if (!anio || !inicio || !fin) {
      throw new Error("Faltan campos: anio, inicio, fin");
    }
    const tmp = new Temporada(
      null,
      Number(anio),
      String(inicio),
      String(fin),
      "inactiva",
      null
    );
    const created = await temporadaRepo.create(tmp.toPlainObject());
    return temporadaRepo.setActiveById(created.id);
  };
}
