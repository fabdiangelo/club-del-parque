

import { MetricServiceClient } from '@google-cloud/monitoring';

class ObtenerMetricas {
  async execute() {
    // Configura tu PROJECT_ID aquí o usa process.env.GCLOUD_PROJECT
    const projectId = process.env.GCLOUD_PROJECT || 'TU_PROJECT_ID';
    const client = new MetricServiceClient();

    // Fechas del periodo actual (mes en curso)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Helper para formatear fechas a RFC3339
    const toRFC3339 = (date) => date.toISOString();

    // Consulta invocaciones de Cloud Functions
    const [cloudFunctionsResponse] = await client.listTimeSeries({
      name: client.projectPath(projectId),
      filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count"',
      interval: {
        startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
        endTime: { seconds: Math.floor(now.getTime() / 1000) }
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 * 60 * 24 }, // 1 día
        perSeriesAligner: 'ALIGN_SUM',
        crossSeriesReducer: 'REDUCE_SUM',
        groupByFields: ['resource.label.function_name']
      },
      view: 'FULL'
    });

    // Suma total de invocaciones en el mes
    let invocaciones = 0;
    if (cloudFunctionsResponse.length > 0) {
      for (const serie of cloudFunctionsResponse) {
        for (const point of serie.points) {
          invocaciones += point.value.int64Value ? Number(point.value.int64Value) : 0;
        }
      }
    }

    // Consulta almacenamiento de Firestore
    const [firestoreStorageResponse] = await client.listTimeSeries({
      name: client.projectPath(projectId),
      filter: 'metric.type="firestore.googleapis.com/database/storage/bytes_used"',
      interval: {
        startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
        endTime: { seconds: Math.floor(now.getTime() / 1000) }
      },
      aggregation: {
        alignmentPeriod: { seconds: 60 * 60 * 24 },
        perSeriesAligner: 'ALIGN_MAX',
        crossSeriesReducer: 'REDUCE_MAX',
      },
      view: 'FULL'
    });

    let firestoreStorageGB = 0;
    if (firestoreStorageResponse.length > 0) {
      // Toma el valor máximo del mes
      const maxPoint = firestoreStorageResponse[0].points[0];
      if (maxPoint && maxPoint.value && maxPoint.value.int64Value) {
        firestoreStorageGB = Number(maxPoint.value.int64Value) / (1024 ** 3);
      }
    }

    // Límite de capa gratuita (ajusta según tu plan)
    const limiteInvocaciones = 2000000; // 2M invocaciones/mes
    const limiteFirestoreGB = 1; // 1 GB

    const metricas = {
      cloudFunctions: {
        usado: invocaciones,
        limite: limiteInvocaciones,
        porcentaje: Math.round((invocaciones / limiteInvocaciones) * 10000) / 100,
        costo: 0.0 // No calculado aquí
      },
      firestore: {
        almacenamiento: {
          usado: Math.round(firestoreStorageGB * 100) / 100, // 2 decimales
          limite: limiteFirestoreGB,
          porcentaje: Math.round((firestoreStorageGB / limiteFirestoreGB) * 10000) / 100
        },
        costo: 0.0 // No calculado aquí
      },
      periodo: {
        inicio: toRFC3339(startOfMonth),
        fin: toRFC3339(now)
      }
    };

    return metricas;
  }
}

export default new ObtenerMetricas();