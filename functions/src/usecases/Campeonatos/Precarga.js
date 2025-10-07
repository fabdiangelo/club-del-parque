import { FormatoCampeonatoRepository } from "../../infraestructure/adapters/FormatoCampeonatoRepository.js";
import FormatoCampeonato from "../../domain/entities/FormatoCampeonato.js";
import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";
import FormatoEtapa from "../../domain/entities/FormatoEtapa.js";

class Precarga {
  constructor() {
    // Plantillas basadas en formatos típicos de tenis
    this.formatos = [
      { id: 'single-32', nombre: 'Individual 32', cantidadJugadores: 32, formatosEtapasIDs: ['eliminacion'] },
      { id: 'single-16', nombre: 'Individual 16', cantidadJugadores: 16, formatosEtapasIDs: ['eliminacion'] },
      { id: 'dobles-16', nombre: 'Dobles 16', cantidadJugadores: 16, formatosEtapasIDs: ['eliminacion'] },
      { id: 'round-robin-4', nombre: 'Round Robin 4', cantidadJugadores: 4, formatosEtapasIDs: ['fase-de-grupos'] },
    ];

    this.repo = new FormatoCampeonatoRepository();
    this.repoEtapas = new FormatoEtapaRepository();

    // Formatos de etapa comunes
    this.formatosEtapas = [
      { id: 'eliminacion', tipoEtapa: 'Eliminación directa', cantidadSets: 3, juegosPorSet: 6, cantidadPartidos: null, cantidadDeJugadoresIni: null, cantidadDeJugadoresFin: null },
      { id: 'fase-de-grupos', tipoEtapa: 'Fase de grupos (Round Robin)', cantidadSets: 3, juegosPorSet: 6, cantidadPartidos: null, cantidadDeJugadoresIni: 4, cantidadDeJugadoresFin: 4 },
      { id: 'consolacion', tipoEtapa: 'Consolación', cantidadSets: 3, juegosPorSet: 6, cantidadPartidos: null, cantidadDeJugadoresIni: null, cantidadDeJugadoresFin: null },
      { id: 'dobles', tipoEtapa: 'Etapa dobles', cantidadSets: 3, juegosPorSet: 6, cantidadPartidos: null, cantidadDeJugadoresIni: null, cantidadDeJugadoresFin: null },
    ];
  }

  async execute() {
    try {
      for (const f of this.formatos) {
        const existing = await this.repo.findById(f.id);
        if (!existing) {
          const formato = new FormatoCampeonato(f.id, f.nombre, f.cantidadJugadores, f.formatosEtapasIDs || []);
          await this.repo.save(formato.toPlainObject());
          console.log(`Formato ${formato.nombre} creado.`);
        } else {
          console.log(`Formato ${f.nombre} ya existe.`);
        }
      }
      // Precargar formatos de etapa
      for (const fe of this.formatosEtapas) {
        const existingEtapa = await this.repoEtapas.findById(fe.id);
        if (!existingEtapa) {
          const etapa = new FormatoEtapa(fe.id, fe.tipoEtapa, fe.cantidadSets, fe.juegosPorSet, fe.cantidadPartidos, fe.cantidadDeJugadoresIni, fe.cantidadDeJugadoresFin);
          await this.repoEtapas.save(etapa.toPlainObject());
          console.log(`Formato de etapa ${etapa.tipoEtapa} creado.`);
        } else {
          console.log(`Formato de etapa ${fe.id} ya existe.`);
        }
      }
    } catch (err) {
      console.error('Error en precarga de formatos:', err);
      throw err;
    }
  }
}

export default new Precarga();
