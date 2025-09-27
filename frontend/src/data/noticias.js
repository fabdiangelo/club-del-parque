export const noticias = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  titulo: `Lo último del Club #${i + 1}`,
  fecha: `0${(i % 9) + 1}/09/2025`,
  resumen:
    "Lor incididunt ut labore et dolore magna aliqua.",
  cuerpo: `Este es el cuerpo completo de la noticia #${i + 1}. 
  cock and ball torture`
}));