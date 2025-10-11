export default function ActivateTemporada(temporadaRepo) {
  return async (id) => {
    if (!id) throw new Error("Falta id");
    return temporadaRepo.setActiveById(id);
  };
}
