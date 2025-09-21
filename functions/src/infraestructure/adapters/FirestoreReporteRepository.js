import DBConnection from '../DBConnection.js';
import { ReporteRepositoryPort } from '../../domain/ports/ReporteRepositoryReport.js';

export class FirestoreReporteRepository extends ReporteRepositoryPort {
    constructor() {
        super();
        this.db = new DBConnection();
    }

    async findById(id) {
        const reporte = await this.db.collection('reportes').doc(id).get();
        if (!reporte.exists) {
            return null;
        }
        return { id: reporte.id, ...reporte.data() };
    }

    async save(reporte) {
        const docRef = await this.db.collection('reportes').add(reporte);
        return docRef.id;
    }

    async update(id, estado) {
        await this.db.collection('reportes').doc(id).update({ estado });
    }

    async findAll() {
        const reportes = await this.db.collection('reportes').get();
        return reportes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async leido(id) {
        await this.db.collection('reportes').doc(id).update({ leido: true });
    }
}