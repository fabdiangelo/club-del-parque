export default function SetTemporadaEstado(temporadaRepo) {
  return async (id, estado) => {
    if (!id || !estado) throw new Error("Falta id o estado");
    if (!["activa", "inactiva"].includes(estado)) throw new Error("Estado inválido");
    if (estado === "activa") return temporadaRepo.setActiveById(id);
    return temporadaRepo.setEstado(id, "inactiva");
  };
}
