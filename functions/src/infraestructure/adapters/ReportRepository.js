import DBConnection from '../ports/DBConnection.js';

export class ReporteRepository {
    constructor() {
        this.db = new DBConnection();
    }

    async findById(id) {
        const reporte = await this.db.getItem('reportes', id);
        if (!reporte) {
            return null;
        }
        return { id: reporte.id, ...reporte};
    }

    async save(reporte) {
        const docRef = await this.db.putItem('reportes', reporte, reporte.id);
        return docRef.id;
    }


    async update(id, estado) {
        const reporte = await this.db.getItem('reportes', id);
        reporte.estado = estado;
        await this.db.putItem('reportes', reporte, id);
    }

    async findAll() {
        const reportes = await this.db.getAllItems('reportes');
        return reportes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async leido(id) {
        const reporte = await this.db.getItem('reportes', id);
        reporte.leido = true;
        await this.db.putItem('reportes', reporte, id);
    }

    async getReportesSinResolver() {
        return await this.db.getItemsWhereNotEqual('reportes', 'estado', 'resuelto');
    }
}