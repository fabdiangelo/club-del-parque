import DBConnection from '../ports/DBConnection.js';
import WPP from '../ports/WPP.js';

export class ReporteRepository {
    constructor() {
        this.db = new DBConnection();
    }

    async findById(id) {
        const reporte = await this.db.getItem('reportes', id);
        if (!reporte.exists) {
            return null;
        }
        return { id: reporte.id, ...reporte.data() };
    }

    async save(reporte) {
        const docRef = await this.db.addItem('reportes', reporte);
        return docRef.id;
    }


    async update(id, estado) {
        await this.db.putItem('reportes', { estado }, id);
    }

    async findAll() {
        const reportes = await this.db.getAllItems('reportes');
        return reportes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async leido(id) {
        await this.db.putItem('reportes', { leido: true }, id);
    }
}