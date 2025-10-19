

export class AceptarPropuesta {
    constructor(reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    async execute(partidoId, propuestaId) {
      

        return await this.reservaRepository.aceptarPropuesta(partidoId, propuestaId);
    }

}