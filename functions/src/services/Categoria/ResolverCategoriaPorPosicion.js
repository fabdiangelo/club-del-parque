export function resolverCategoriaPorPosicion(posicion, categorias) {
  const candidatas = categorias.filter(c => c.contienePosicion(posicion));
  if (candidatas.length === 0) return null;
  if (candidatas.length === 1) return candidatas[0];

  return candidatas.sort((a, b) => (a.rangoMax - a.rangoMin) - (b.rangoMax - b.rangoMin))[0];
}