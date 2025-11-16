import DBConnection from '../ports/DBConnection.js';

export class ReporteRepository {
  constructor() {
    this.db = new DBConnection();
  }

  async findById(id) {
    const reporte = await this.db.getItem('reportes', id);
    return reporte ? { id: reporte.id, ...reporte } : null;
  }

  async save(reporte) {
    const docRef = await this.db.putItem('reportes', reporte, reporte.id);
    return docRef.id;
  }

  async update(id, patch) {
    const current = await this.db.getItem('reportes', id);
    if (!current) throw new Error("Reporte no encontrado");

    const next = { ...current, ...patch };
    await this.db.putItem('reportes', next, id);
    return { id, ...next };
  }

  async findAll() {
    return await this.db.getAllItems('reportes');
  }

  async leido(id) {
    return this.update(id, { leido: true, actualizadoEn: new Date().toISOString() });
  }

  async getReportesSinResolver() {
    return await this.db.getItemsWhereNotEqual('reportes', 'estado', 'resuelto');
  }
}
