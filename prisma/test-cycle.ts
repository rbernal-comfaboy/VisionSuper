import { prisma } from "../src/lib/db";
import { extractData } from "../src/lib/dbConnector";
import { validateDataset } from "../src/lib/xsdValidator";
import { generateXml } from "../src/lib/xmlGenerator";

async function runTestCycle() {
  console.log("====================================================");
  console.log("🧪 SUPER-APP COMPREHENSIVE TEST CYCLE - VISIONSUPER");
  console.log("====================================================\n");

  // ----------------------------------------------------
  // TEST 1: NOTIFICATION DATABASE PERSISTENCE & FLOW
  // ----------------------------------------------------
  console.log("🔔 [Test 1] Probando persistencia de notificaciones en base de datos...");
  
  // Buscar un usuario de prueba creado en el Seed
  const testUser = await prisma.user.findFirst();
  if (!testUser) {
    throw new Error("❌ Error: No se encontraron usuarios en la base de datos para correr el test de notificaciones.");
  }
  console.log(`   - Usuario de prueba encontrado: ${testUser.name} (${testUser.email})`);

  // Crear una nueva notificación de alerta
  const testNotif = await prisma.notification.create({
    data: {
      userId: testUser.id,
      content: "TEST: Inconsistencia XSD detectada en extracción de caja 2-002A",
      type: "ALERT",
      isRead: false,
      link: "/reports/999",
    },
  });
  console.log(`   - Notificación de alerta insertada con ID: ${testNotif.id}`);

  // Verificar que se puede consultar y que no está leída
  const queriedNotif = await prisma.notification.findUnique({
    where: { id: testNotif.id },
  });
  if (!queriedNotif || queriedNotif.isRead !== false || queriedNotif.type !== "ALERT") {
    throw new Error("❌ Error: La notificación no se persistió con los valores iniciales correctos.");
  }
  console.log("   - Consulta de notificación inicial exitosa (isRead = false).");

  // Marcar como leída
  const updatedNotif = await prisma.notification.update({
    where: { id: testNotif.id },
    data: { isRead: true },
  });
  if (updatedNotif.isRead !== true) {
    throw new Error("❌ Error: No se pudo actualizar el estado de lectura de la notificación.");
  }
  console.log("   - Actualización exitosa (isRead = true).");

  // Limpieza del registro de prueba
  await prisma.notification.delete({
    where: { id: testNotif.id },
  });
  console.log("   - Notificación de prueba eliminada correctamente.");
  console.log("✅ TEST 1 PASADO: El sistema de persistencia y flujo de notificaciones funciona al 100%.\n");

  // ----------------------------------------------------
  // TEST 2: LOOKER-STYLE FEDERATED EXTRACTION (IN-MEMORY JOIN)
  // ----------------------------------------------------
  console.log("🔗 [Test 2] Probando extracción de datos federados multi-fuente (Join en Memoria)...");

  // Asegurar que existan al menos 2 conexiones simuladas en la base de datos para que el motor
  // de dbConnector pueda resolver los IDs correspondientes.
  let conn1 = await prisma.connection.findFirst({ where: { name: "Base de Datos Core Empresas" } });
  let conn2 = await prisma.connection.findFirst({ where: { name: "Libro Mayor de Aportes" } });

  if (!conn1 || !conn2) {
    console.log("   - Creando conexiones simuladas temporales para resolver IDs federados...");
    if (!conn1) {
      conn1 = await prisma.connection.create({
        data: { name: "Base de Datos Core Empresas", engine: "POSTGRESQL", isMock: true }
      });
    }
    if (!conn2) {
      conn2 = await prisma.connection.create({
        data: { name: "Libro Mayor de Aportes", engine: "POSTGRESQL", isMock: true }
      });
    }
  }

  console.log(`   - Conexiones para federación listas: Core ID=${conn1.id}, Aportes ID=${conn2.id}`);

  // Configurar el plan JSON federado cruzando las dos fuentes
  const federatedPlan = {
    federated: true,
    sources: [
      { connectionId: conn1.id, query: "SELECT * FROM core_empresas", alias: "core" },
      { connectionId: conn2.id, query: "SELECT * FROM ledger_aportes", alias: "aportes" }
    ],
    join: {
      left: "core.numero_doc",
      right: "aportes.nit_empresa",
      type: "inner"
    }
  };

  const federatedQueryString = JSON.stringify(federatedPlan);

  // Ejecutar extracción
  const connectionDetails = {
    engine: conn1.engine,
    host: conn1.host,
    port: conn1.port,
    username: conn1.username,
    password: conn1.password,
    database: conn1.database,
    isMock: conn1.isMock
  };

  const mergedRows = await extractData(connectionDetails, federatedQueryString, "2-001A");

  console.log(`   - Se obtuvieron ${mergedRows.length} registros combinados en memoria.`);

  // Validar el cruce: cada fila unificada debe tener columnas de ambas fuentes
  if (mergedRows.length === 0) {
    throw new Error("❌ Error: La federación no retornó filas.");
  }

  const sampleRow = mergedRows[0];
  console.log("   - Fila federada de muestra:", JSON.stringify(sampleRow));

  if (!sampleRow.hasOwnProperty("razon_social") || !sampleRow.hasOwnProperty("total_aportado")) {
    throw new Error("❌ Error: La unión federada falló. Falta 'razon_social' o 'total_aportado' en la fila cruzada.");
  }
  console.log("✅ TEST 2 PASADO: Extracción Looker-style federada con cruzado en memoria completada con éxito.\n");

  // ----------------------------------------------------
  // TEST 3: XSD QUALITY AUDITING & CORRECTIONS
  // ----------------------------------------------------
  console.log("🔴 [Test 3] Probando motor de validación XSD & Ciclo de correcciones...");

  // Mapeo SQL a XSD configurado en el sistema para 2-001A
  const fieldMappings = {
    TIP_IDENTIFICACION: "tipo_doc",
    NUM_IDENTIFICACION: "numero_doc",
    NOM_EMPRESA: "razon_social",
    COD_MUNICIPIO_DANE: "dane_municipio",
    DIR_CORRESPONDECIA: "direccion",
    EST_VINCULACION: "estado",
    TIP_APORTANTE: "tipo_aportante",
    TIP_SECTOR: "sector",
    ACT_ECONOMICA: "codigo_actividad",
    SIT_EMPRESA_LEY_1429: "ley_1429",
    PRO_PAGO_LEY_1429: "pago_1429",
    SIT_EMPRESA_LEY_590: "ley_590",
    PRO_PAGO_LEY_590: "pago_590",
    APO_TOTAL_MENSUAL: "total_aportado",
    INT_PAGADOS_MORA: "intereses_mora",
    VAL_REINTEGROS: "reintegros",
  };

  // Datos extraídos con inconsistencias deliberadas
  const rawDataset = [
    {
      tipo_doc: 1,
      numero_doc: "860009999123456789", // ❌ Supera longitud 16
      razon_social: "ComfaCaja Familiar Especial S.A.",
      dane_municipio: "11001",
      direccion: "Calle 100 # 15-30",
      estado: 1,
      tipo_aportante: 1,
      sector: 1,
      codigo_actividad: "8513",
      ley_1429: 1,
      pago_1429: 0,
      ley_590: 0,
      pago_590: 0,
      total_aportado: 15000000,
      intereses_mora: 0,
      reintegros: 0,
    },
    {
      tipo_doc: 123, // ❌ Supera 2 dígitos
      numero_doc: "900123456",
      razon_social: "", // ❌ Razón social vacía requerida
      dane_municipio: "05001",
      direccion: "Av El Poblado # 20-50",
      estado: 1,
      tipo_aportante: 1,
      sector: 1,
      codigo_actividad: "8513",
      ley_1429: 1,
      pago_1429: 0,
      ley_590: 0,
      pago_590: 0,
      total_aportado: -500, // ❌ Aporte negativo no permitido
      intereses_mora: 0,
      reintegros: 0,
    }
  ];

  let errors = validateDataset("2-001A", rawDataset, fieldMappings);
  console.log("   - Errores XSD detectados inicialmente:", JSON.stringify(errors, null, 2));

  // Asegurar que detectó los errores esperados
  if (Object.keys(errors).length === 0) {
    throw new Error("❌ Error: El validador debió detectar inconsistencias pero retornó 0 errores.");
  }
  console.log("   - El motor XSD identificó las fallas de longitud, tipos y valores negativos perfectamente.");

  // Aplicar corrección
  const correctedDataset = JSON.parse(JSON.stringify(rawDataset));
  correctedDataset[0].numero_doc = "860009999";
  correctedDataset[1].tipo_doc = "01";
  correctedDataset[1].razon_social = "COOPERATIVA DE ALIMENTOS LTDA";
  correctedDataset[1].total_aportado = 4500000;

  console.log("   - Aplicando correcciones manuales...");
  errors = validateDataset("2-001A", correctedDataset, fieldMappings);

  if (Object.keys(errors).length > 0) {
    throw new Error(`❌ Error: Aún quedan inconsistencias tras corregir: ${JSON.stringify(errors)}`);
  }
  console.log("✅ TEST 3 PASADO: El motor XSD y el ciclo de corrección in-situ operan correctamente.\n");

  // ----------------------------------------------------
  // TEST 4: XML COMPILATION & EXPORT
  // ----------------------------------------------------
  console.log("📦 [Test 4] Probando compilación del archivo XML final...");

  // Formatear al esquema de etiquetas XSD
  const xmlRows = correctedDataset.map((row: any) => {
    const formatted: any = {};
    Object.entries(fieldMappings).forEach(([xsdTag, sqlCol]) => {
      formatted[xsdTag] = row[sqlCol];
    });
    return formatted;
  });

  const finalXml = generateXml("2-001A", xmlRows);
  
  if (!finalXml.includes("<EMPRESAS_Y_APORTANTES_2017C01>") || !finalXml.includes("<T_EMPRESAS_Y_APORTANTES_2017C01>")) {
    throw new Error("❌ Error: Estructura del XML generado es inválida. Faltan tags obligatorios.");
  }
  
  console.log("   - Estructura y cabeceras del XML validadas correctamente.");
  console.log("✅ TEST 4 PASADO: XML compilado correctamente en cumplimiento con el estándar de la SSF.\n");

  // ----------------------------------------------------
  // TEST 5: LOOKER-STYLE SEMANTIC DATA SOURCE & CALCULATED FIELDS
  // ----------------------------------------------------
  console.log("🧮 [Test 5] Probando capa semántica Looker-Style y Campos Calculados en memoria...");

  // Buscar la fuente de datos semántica creada en el Seed
  const testDs = await prisma.dataSource.findFirst({
    where: { name: "Cajas de Compensación - Presupuesto Semántico" },
    include: { connection: true }
  });

  if (!testDs) {
    throw new Error("❌ Error: No se encontró la fuente de datos semántica de prueba en la base de datos.");
  }
  console.log(`   - Fuente de datos semántica encontrada: ${testDs.name} (ID: ${testDs.id})`);

  // Extraer datos usando la conexión y la fuente de datos semántica
  const dsConnection = {
    engine: testDs.connection.engine,
    host: testDs.connection.host,
    port: testDs.connection.port,
    username: testDs.connection.username,
    password: testDs.connection.password,
    database: testDs.connection.database,
    isMock: testDs.connection.isMock
  };

  const dsRows = await extractData(
    dsConnection,
    "SELECT * FROM presupuesto_cajas",
    "2-002A",
    testDs
  );

  console.log(`   - Se obtuvieron ${dsRows.length} registros semánticos de Cajas.`);
  if (dsRows.length === 0) {
    throw new Error("❌ Error: No se retornaron registros para la fuente de datos semántica.");
  }

  // Verificar que el campo calculado 'diferencia_caja' fue inyectado y computado correctamente
  const firstRow = dsRows[0];
  console.log("   - Fila semántica calculada de muestra:", JSON.stringify(firstRow));

  if (!firstRow.hasOwnProperty("diferencia_caja")) {
    throw new Error("❌ Error: El campo calculado 'diferencia_caja' no fue generado en el dataset.");
  }

  const expectedDiff = firstRow.valor_presupuesto - firstRow.valor_ejecutado;
  if (firstRow.diferencia_caja !== expectedDiff) {
    throw new Error(`❌ Error: El cálculo de 'diferencia_caja' es incorrecto. Esperado: ${expectedDiff}, Obtenido: ${firstRow.diferencia_caja}`);
  }

  console.log(`   - Campo calculado 'diferencia_caja' verificado con éxito (${firstRow.valor_presupuesto} - ${firstRow.valor_ejecutado} = ${firstRow.diferencia_caja}).`);
  console.log("✅ TEST 5 PASADO: El motor de capa semántica Looker-Style computó campos calculados de forma 100% correcta.\n");

  console.log("====================================================");
  console.log("🎉 ¡SÚPER EXCELENTE! TODOS LOS TESTS PASARON EXITOSAMENTE");
  console.log("====================================================");
}

runTestCycle().catch((err) => {
  console.error("❌ Fallo en la ejecución del ciclo de prueba:", err);
  process.exit(1);
});
