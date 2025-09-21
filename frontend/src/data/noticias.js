export const noticias = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  titulo: `Lo último del Club #${i + 1}`,
  fecha: `0${(i % 9) + 1}/09/2025`,
  resumen:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  cuerpo: `Este es el cuerpo completo de la noticia #${i + 1}. 
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere justo ac lorem euismod,
  non rutrum mi aliquet. Vivamus nec lorem vitae arcu lacinia interdum.`
}));