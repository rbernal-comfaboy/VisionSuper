import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as crypto from "crypto";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Native hashing helper using PBKDF2 (no external bcrypt dependencies needed)
function hashPassword(password: string): string {
  const salt = "visionsupersalt"; // Simple fixed salt for seed consistency
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

async function main() {
  console.log("🌱 Iniciando inserción de datos semilla...");

  // 1. Limpieza de tablas (en orden inverso de dependencia)
  await prisma.comment.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.reportMapping.deleteMany({});
  await prisma.dataSource.deleteMany({});
  await prisma.connection.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.area.deleteMany({});

  console.log("🧹 Tablas existentes limpiadas.");

  // 2. Crear Áreas
  const areaFinanciera = await prisma.area.create({ data: { name: "Financiera" } });
  const areaAportes = await prisma.area.create({ data: { name: "Aportes y Subsidios" } });
  const areaProyectos = await prisma.area.create({ data: { name: "Banco de Proyectos" } });
  const areaSeguridad = await prisma.area.create({ data: { name: "Seguridad de la Información" } });

  console.log("🏢 Áreas creadas.");

  // 3. Crear Usuarios
  const passwordHash = hashPassword("Vision123*");

  // Admin
  await prisma.user.create({
    data: {
      email: "admin@visionsuper.com",
      passwordHash,
      name: "Carlos Administrador",
      role: "ADMIN",
    },
  });

  // Área Financiera
  const analistaFin = await prisma.user.create({
    data: {
      email: "analista.fin@visionsuper.com",
      passwordHash,
      name: "Juan Analista Financiero",
      role: "ANALYST",
      areaId: areaFinanciera.id,
    },
  });

  const revisorFin1 = await prisma.user.create({
    data: {
      email: "revisor.fin1@visionsuper.com",
      passwordHash,
      name: "María Revisora Financiera (Principal)",
      role: "APPROVER",
      areaId: areaFinanciera.id,
    },
  });

  const revisorFin2 = await prisma.user.create({
    data: {
      email: "revisor.fin2@visionsuper.com",
      passwordHash,
      name: "Eduardo Revisor Financiero (Secundario)",
      role: "APPROVER",
      areaId: areaFinanciera.id,
    },
  });

  // Área Aportes
  await prisma.user.create({
    data: {
      email: "analista.apo@visionsuper.com",
      passwordHash,
      name: "Sandra Analista de Aportes",
      role: "ANALYST",
      areaId: areaAportes.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "revisor.apo@visionsuper.com",
      passwordHash,
      name: "Roberto Revisor de Aportes",
      role: "APPROVER",
      areaId: areaAportes.id,
    },
  });

  console.log("👥 Usuarios creados (Contraseña por defecto: Vision123*).");

  // 4. Crear Conexiones de Base de Datos
  const conexionPrincipal = await prisma.connection.create({
    data: {
      name: "Base de Datos Operacional Financiera",
      engine: "POSTGRESQL",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "password_simulado",
      database: "operacional_db",
      isMock: true, // Para pruebas locales, simulará datos
    },
  });

  console.log("🔌 Conexiones de base de datos registradas.");

  // 5. Crear Mapeos de Reportes Piloto
  // Reporte 2-001A (Empresas y Aportantes)
  const mapping2001A = {
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

  await prisma.reportMapping.create({
    data: {
      name: "Extracción Mensual de Empresas y Aportantes (2-001A)",
      reportCode: "2-001A",
      sqlQuery: `SELECT 
  t_identificacion as tipo_doc, 
  n_identificacion as numero_doc, 
  razon_social, 
  dane_municipio, 
  direccion, 
  estado, 
  tipo_aportante, 
  sector, 
  actividad_economica as codigo_actividad, 
  sit_ley_1429 as ley_1429, 
  pro_pago_1429 as pago_1429, 
  sit_ley_590 as ley_590, 
  pro_pago_590 as pago_590, 
  total_mensual as total_aportado, 
  intereses_mora, 
  reintegros 
FROM base_aportantes 
WHERE periodo = '2025-05';`,
      fieldMappings: JSON.stringify(mapping2001A),
      connectionId: conexionPrincipal.id,
    },
  });

  console.log("🗺️ Mapeo piloto de reportes (2-001A) configurado con éxito.");

  // 5.1 Crear Fuente de Datos Semántica Looker-Style
  console.log("📊 Creando Fuente de Datos Semántica Looker-Style...");
  const dataSourceCajas = await prisma.dataSource.create({
    data: {
      name: "Cajas de Compensación - Presupuesto Semántico",
      description: "Fuente de datos semántica para el análisis del presupuesto y ejecución contable en Cajas de Compensación.",
      connectionId: conexionPrincipal.id,
      baseConfigJson: JSON.stringify({ type: "TABLE", queryOrTable: "presupuesto_cajas" }),
      fieldsJson: JSON.stringify([
        { id: "nit_caja", name: "NIT de la Caja", type: "IDENTIFIER", category: "DIMENSION" },
        { id: "periodo", name: "Periodo", type: "DATE", category: "DIMENSION" },
        { id: "codigo_concepto", name: "Código de Concepto", type: "TEXT", category: "DIMENSION" },
        { id: "descripcion", name: "Descripción de Concepto", type: "TEXT", category: "DIMENSION" },
        { id: "valor_presupuesto", name: "Presupuesto Inicial", type: "CURRENCY", category: "MEASURE", aggregation: "SUM" },
        { id: "valor_ejecutado", name: "Valor Ejecutado", type: "CURRENCY", category: "MEASURE", aggregation: "SUM" },
        { id: "diferencia_caja", name: "Diferencia de Caja", type: "CURRENCY", category: "MEASURE", formula: "valor_presupuesto - valor_ejecutado", isCalculated: true }
      ])
    }
  });

  // 5.2 Crear Mapeo para 2-002A usando la Fuente de Datos
  const mapping2002A = {
    nit_caja: "nit_caja",
    periodo: "periodo",
    codigo_concepto: "codigo_concepto",
    descripcion: "descripcion",
    valor_presupuesto: "valor_presupuesto",
    valor_ejecutado: "valor_ejecutado"
  };

  await prisma.reportMapping.create({
    data: {
      name: "Ejecución Presupuestal Mensual de Cajas (2-002A)",
      reportCode: "2-002A",
      dataSourceId: dataSourceCajas.id,
      fieldMappings: JSON.stringify(mapping2002A),
    }
  });

  console.log("🗺️ Mapeo piloto de reportes (2-002A) con Fuente de Datos configurado con éxito.");

  // 6. Crear notificaciones iniciales
  console.log("🔔 Creando notificaciones iniciales...");
  await prisma.notification.create({
    data: {
      userId: analistaFin.id,
      content: "⚠️ Alerta de Calidad: Extracción del reporte '2-001A' contiene 4 inconsistencias XSD.",
      type: "ALERT",
      isRead: false,
      link: "/reports",
    },
  });

  await prisma.notification.create({
    data: {
      userId: revisorFin1.id,
      content: "📥 Firma Requerida: El Analista Juan ha remitido el reporte '2-001A - Financiera' para tu aprobación.",
      type: "INFO",
      isRead: false,
      link: "/reports",
    },
  });

  await prisma.notification.create({
    data: {
      userId: revisorFin2.id,
      content: "📥 Firma Requerida: El Analista Juan ha remitido el reporte '2-001A - Financiera' para tu aprobación.",
      type: "INFO",
      isRead: false,
      link: "/reports",
    },
  });

  console.log("🌱 ¡Datos semilla insertados correctamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar datos semilla:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
