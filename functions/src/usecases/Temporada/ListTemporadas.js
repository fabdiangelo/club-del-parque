export default function ListTemporadas(temporadaRepo) {
  return () => temporadaRepo.list();
}
