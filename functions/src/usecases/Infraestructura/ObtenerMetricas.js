

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


    // Consulta almacenamiento de Firestore (Data and Index Storage Size)
    let firestoreStorageGB = 0;
    try {
      const [firestoreStorageResponse] = await client.listTimeSeries({
        name: client.projectPath(projectId),
        filter: 'metric.type="firestore.googleapis.com/database/total_bytes"',
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
      if (firestoreStorageResponse.length > 0) {
        // Toma el valor máximo del mes
        const maxPoint = firestoreStorageResponse[0].points[0];
        if (maxPoint && maxPoint.value && maxPoint.value.int64Value) {
          firestoreStorageGB = Number(maxPoint.value.int64Value) / (1024 ** 3);
        }
      }
    } catch (err) {
      // Si la métrica no existe, deja el valor en 0 y no falla la función
      console.warn('No se encontró la métrica de almacenamiento de Firestore:', err.message);
    }

    // Límite de capa gratuita (Firebase Spark/Blaze, diciembre 2025)
    const limiteInvocaciones = 2000000; // 2M invocaciones/mes (Cloud Functions)
    const limiteFirestoreGB = 1; // 1 GB almacenamiento
    const limiteLecturas = 50000; // 50K lecturas/día
    const limiteEscrituras = 20000; // 20K escrituras/día
    const limiteEliminaciones = 20000; // 20K eliminaciones/día
    const limiteHostingGB = 10; // 10 GB/mes transferencia

    // Precios (USD, diciembre 2025, aproximados)
    const precioInvocacion = 0.0000004; // $0.40 por millón de invocaciones
    const precioFirestoreLectura = 0.06 / 100000; // $0.06 por 100K lecturas
    const precioFirestoreEscritura = 0.18 / 100000; // $0.18 por 100K escrituras
    const precioFirestoreEliminacion = 0.02 / 100000; // $0.02 por 100K eliminaciones
    const precioFirestoreGB = 0.18; // $0.18 por GB/mes
    const precioHostingGB = 0.026; // $0.026 por GB/mes


    // --- MÉTRICAS REALES ---
    // Helper para sumar puntos de una métrica
    const sumarPuntos = (series) => {
      let total = 0;
      if (series && series.length > 0) {
        for (const serie of series) {
          for (const point of serie.points) {
            total += point.value.int64Value ? Number(point.value.int64Value) : 0;
          }
        }
      }
      return total;
    };

    // Firestore: lecturas
    let lecturasUsadas = 0;
    try {
      const [lecturasResponse] = await client.listTimeSeries({
        name: client.projectPath(projectId),
        filter: 'metric.type="firestore.googleapis.com/document/read_count"',
        interval: {
          startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
          endTime: { seconds: Math.floor(now.getTime() / 1000) }
        },
        aggregation: {
          alignmentPeriod: { seconds: 60 * 60 * 24 },
          perSeriesAligner: 'ALIGN_SUM',
          crossSeriesReducer: 'REDUCE_SUM',
        },
        view: 'FULL'
      });
      lecturasUsadas = sumarPuntos(lecturasResponse);
    } catch (err) {
      console.warn('No se encontró la métrica de lecturas de Firestore:', err.message);
    }

    // Firestore: escrituras
    let escriturasUsadas = 0;
    try {
      const [escriturasResponse] = await client.listTimeSeries({
        name: client.projectPath(projectId),
        filter: 'metric.type="firestore.googleapis.com/document/write_count"',
        interval: {
          startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
          endTime: { seconds: Math.floor(now.getTime() / 1000) }
        },
        aggregation: {
          alignmentPeriod: { seconds: 60 * 60 * 24 },
          perSeriesAligner: 'ALIGN_SUM',
          crossSeriesReducer: 'REDUCE_SUM',
        },
        view: 'FULL'
      });
      escriturasUsadas = sumarPuntos(escriturasResponse);
    } catch (err) {
      console.warn('No se encontró la métrica de escrituras de Firestore:', err.message);
    }

    // Firestore: eliminaciones
    let eliminacionesUsadas = 0;
    try {
      const [eliminacionesResponse] = await client.listTimeSeries({
        name: client.projectPath(projectId),
        filter: 'metric.type="firestore.googleapis.com/document/delete_count"',
        interval: {
          startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
          endTime: { seconds: Math.floor(now.getTime() / 1000) }
        },
        aggregation: {
          alignmentPeriod: { seconds: 60 * 60 * 24 },
          perSeriesAligner: 'ALIGN_SUM',
          crossSeriesReducer: 'REDUCE_SUM',
        },
        view: 'FULL'
      });
      eliminacionesUsadas = sumarPuntos(eliminacionesResponse);
    } catch (err) {
      console.warn('No se encontró la métrica de eliminaciones de Firestore:', err.message);
    }

    // Hosting: transferencia de salida (GB)
    let hostingUsado = 0;
    try {
      const [hostingResponse] = await client.listTimeSeries({
        name: client.projectPath(projectId),
        filter: 'metric.type="firebasehosting.googleapis.com/byte_count"',
        interval: {
          startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
          endTime: { seconds: Math.floor(now.getTime() / 1000) }
        },
        aggregation: {
          alignmentPeriod: { seconds: 60 * 60 * 24 },
          perSeriesAligner: 'ALIGN_SUM',
          crossSeriesReducer: 'REDUCE_SUM',
        },
        view: 'FULL'
      });
      const totalBytes = sumarPuntos(hostingResponse);
      hostingUsado = Number((totalBytes / (1024 ** 3)).toFixed(4)); // GB con 4 decimales
    } catch (err) {
      console.warn('No se encontró la métrica de hosting:', err.message);
    }

    // Calcular porcentajes
    const lecturasPorcentaje = Math.round((lecturasUsadas / limiteLecturas) * 100);
    const escriturasPorcentaje = Math.round((escriturasUsadas / limiteEscrituras) * 100);
    const eliminacionesPorcentaje = Math.round((eliminacionesUsadas / limiteEliminaciones) * 100);
    const almacenamientoPorcentaje = Math.round((firestoreStorageGB / limiteFirestoreGB) * 10000) / 100;
    const porcentajePromedio = (lecturasPorcentaje + escriturasPorcentaje + eliminacionesPorcentaje + almacenamientoPorcentaje) / 4;

    // --- CÁLCULO DE COSTOS ---
    // Cloud Functions
    const invocacionesExcedente = Math.max(invocaciones - limiteInvocaciones, 0);
    const costoCloudFunctions = invocacionesExcedente * precioInvocacion;

    // Firestore
    const lecturasExcedente = Math.max(lecturasUsadas - (limiteLecturas * (now.getDate())), 0); // Límite diario * días del mes
    const escriturasExcedente = Math.max(escriturasUsadas - (limiteEscrituras * (now.getDate())), 0);
    const eliminacionesExcedente = Math.max(eliminacionesUsadas - (limiteEliminaciones * (now.getDate())), 0);
    const almacenamientoExcedente = Math.max(firestoreStorageGB - limiteFirestoreGB, 0);
    const costoFirestore =
      (lecturasExcedente * precioFirestoreLectura) +
      (escriturasExcedente * precioFirestoreEscritura) +
      (eliminacionesExcedente * precioFirestoreEliminacion) +
      (almacenamientoExcedente * precioFirestoreGB);

    // Hosting
    const hostingExcedente = Math.max(hostingUsado - limiteHostingGB, 0);
    const costoHosting = hostingExcedente * precioHostingGB;

    // Gasto total
    const gastoTotal = Number((costoCloudFunctions + costoFirestore + costoHosting).toFixed(2));

    const metricas = {
      cloudFunctions: {
        usado: invocaciones,
        limite: limiteInvocaciones,
        porcentaje: Math.round((invocaciones / limiteInvocaciones) * 10000) / 100,
        costo: Number(costoCloudFunctions.toFixed(2))
      },
      hosting: {
        usado: hostingUsado,
        limite: limiteHostingGB,
        porcentaje: Math.round((hostingUsado / limiteHostingGB) * 100),
        costo: Number(costoHosting.toFixed(2))
      },
      firestore: {
        lecturas: {
          usado: lecturasUsadas,
          limite: limiteLecturas,
          porcentaje: lecturasPorcentaje
        },
        escrituras: {
          usado: escriturasUsadas,
          limite: limiteEscrituras,
          porcentaje: escriturasPorcentaje
        },
        eliminaciones: {
          usado: eliminacionesUsadas,
          limite: limiteEliminaciones,
          porcentaje: eliminacionesPorcentaje
        },
        almacenamiento: {
          usado: Number(firestoreStorageGB.toFixed(4)), // 4 decimales
          limite: limiteFirestoreGB,
          porcentaje: almacenamientoPorcentaje
        },
        porcentajePromedio,
        costo: Number(costoFirestore.toFixed(2))
      },
      gastoTotal,
      periodo: {
        inicio: toRFC3339(startOfMonth),
        fin: toRFC3339(now)
      }
    };

    return metricas;
  }
}

export default new ObtenerMetricas();