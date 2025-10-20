export function rangosSeSolapan(a, b) {
  return a.rangoMax >= b.rangoMin && b.rangoMax >= a.rangoMin;
}
