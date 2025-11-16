import FormatoEtapa from "../../domain/entities/FormatoEtapa.js";
import FormatoCampeonato from "../../domain/entities/FormatoCampeonato.js";
import { FormatoEtapaRepository } from "../../infraestructure/adapters/FormatoEtapaRepository.js";
import { FormatoCampeonatoRepository } from "../../infraestructure/adapters/FormatoCampeonatoRepository.js";

class Precarga {
  constructor() {
    this.formatoCampeonatoRepository = new FormatoCampeonatoRepository();
    this.formatoEtapaRepository = new FormatoEtapaRepository();
    
    // Formatos de etapas
    this.formatosEtapas = [
      { id: 'eliminacion (3 Sets)', tipoEtapa: 'eliminacion', cantidadSets: 3, juegosPorSet: 6, permitirEmpate: false},
      { id: 'eliminacion (5 Sets)', tipoEtapa: 'eliminacion', cantidadSets: 5, juegosPorSet: 6, permitirEmpate: false},
      { id: 'fase de grupos (3 sets)', tipoEtapa: 'roundRobin', cantidadSets: 3, juegosPorSet: 6, permitirEmpate: false},
    ];

    // Formatos de Campeonatos
    this.formatos = [
      { id: 'single-32', nombre: 'Individual 32', cantidadJugadores: 32, formatosEtapasIDs: ['eliminacion (3 Sets)'] },
      { id: 'single-16', nombre: 'Individual 16', cantidadJugadores: 16, formatosEtapasIDs: ['eliminacion (5 Sets)'] },
      { id: 'round-robin-4', nombre: 'Round Robin 4', cantidadJugadores: 4, formatosEtapasIDs: ['fase de grupos (3 sets)'] },
      { id: 'completo-32', nombre: 'Completo 32', cantidadJugadores: 32, formatosEtapasIDs: ['fase de grupos (3 sets)', 'eliminacion (3 Sets)'] },
      { id: 'completo-16', nombre: 'Completo 16', cantidadJugadores: 16, formatosEtapasIDs: ['fase de grupos (3 sets)', 'eliminacion (3 Sets)'] },
      { id: 'completo-8', nombre: 'Completo 8', cantidadJugadores: 8, formatosEtapasIDs: ['fase de grupos (3 sets)', 'eliminacion (3 Sets)'] },
    ];
  }

  async execute() {
    try {
      for (const fe of this.formatosEtapas) {
        const existingEtapa = await this.formatoEtapaRepository.findById(fe.id);
        if (!existingEtapa) {
          const etapa = new FormatoEtapa(fe.id, fe.tipoEtapa, fe.cantidadSets, fe.juegosPorSet, fe.permitirEmpate);
          await this.formatoEtapaRepository.save(etapa.toPlainObject());
          console.log(`Formato de etapa ${etapa.tipoEtapa} creado.`);
        } else {
          console.log(`Formato de etapa ${fe.id} ya existe.`);
        }
      }

      for (const f of this.formatos) {
        const existing = await this.formatoCampeonatoRepository.findById(f.id);
        if (!existing) {
          const formato = new FormatoCampeonato(f.id, f.nombre, f.cantidadJugadores, f.formatosEtapasIDs || []);
          await this.formatoCampeonatoRepository.save(formato.toPlainObject());
          console.log(`Formato ${formato.nombre} creado.`);
        } else {
          console.log(`Formato ${f.nombre} ya existe.`);
        }
      }
    } catch (err) {
      console.error('Error en precarga de formatos:', err);
      throw err;
    }
  }
}

export default new Precarga();
