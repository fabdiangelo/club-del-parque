export default function GetActiveTemporada(temporadaRepo) {
  return () => temporadaRepo.getActive();
}
