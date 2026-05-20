"use client";

import React, { useState } from "react";

// Mock data representing BPM statistics
const areaPerformance = [
  { area: "Fondo de Aportes", activeReports: 2, avgDelayHours: 4.5, onTimeRate: 98, status: "EXCELENTE" },
  { area: "Caja de Compensación 2-002A", activeReports: 1, avgDelayHours: 18.2, onTimeRate: 85, status: "ATENCIÓN" },
  { area: "Finanzas Generales", activeReports: 0, avgDelayHours: 2.1, onTimeRate: 100, status: "EXCELENTE" },
];

const initialBpmLogs = [
  {
    time: "Hace 10 mins",
    report: "2-001A (ID #1)",
    event: "Envío a Aprobación",
    description: "Analista completó correcciones de la fila 4 y remitió firma.",
    user: "Juan Carlos Pérez (Analista)",
    type: "SUBMISSION",
  },
  {
    time: "Hace 1 hora",
    report: "2-002A (ID #2)",
    event: "Rechazo de Firma",
    description: "Revisor devolvió a borrador por saldo negativo en concepto 1020.",
    user: "Marta Gómez (Aprobador)",
    type: "REJECTION",
  },
  {
    time: "Hace 3 horas",
    report: "2-001A (ID #1)",
    event: "Falla de Calidad XSD",
    description: "Extracción inicial detenida por 5 errores de longitud de NIT.",
    user: "Sistema (Auditoría)",
    type: "ALERT",
  },
  {
    time: "Ayer, 4:30 PM",
    report: "2-002A (ID #2)",
    event: "Extracción Exitosa",
    description: "Conexión 'Compensación Regional' cruzada con 'Ledger Financiero'.",
    user: "Mapeador Federado",
    type: "EXTRACTION",
  },
];

export default function BpmWorkflowPage() {
  const [logs, setLogs] = useState(initialBpmLogs);
  const [activeStep, setActiveStep] = useState<number>(1); // Step 2 (0-indexed: Auditoría) is active by default

  const bpmSteps = [
    {
      title: "Extracción",
      subtitle: "Multi-fuente federada",
      icon: "📥",
      description: "Consulta asíncrona de datos en bases Postgres/Mocks.",
      color: "indigo",
    },
    {
      title: "Auditoría XSD",
      subtitle: "Calidad regulatoria",
      icon: "🔴",
      description: "Validación estricta de esquemas, tipos y restricciones.",
      color: "rose",
    },
    {
      title: "Corrección",
      subtitle: "Hoja interactiva",
      icon: "✍️",
      description: "Edición instantánea en celda y re-evaluación dinámica.",
      color: "amber",
    },
    {
      title: "Firma Multinivel",
      subtitle: "Firma digital del área",
      icon: "👥",
      description: "Aprobación y respaldo digital por firmantes del área.",
      color: "emerald",
    },
    {
      title: "Sello XML",
      subtitle: "Generación y descarga",
      icon: "📜",
      description: "Generación del XML oficial firmado y listo para la SSF.",
      color: "blue",
    },
  ];

  return (
    <div className="space-y-8 p-1 animate-fade-in text-text-main">
      {/* Encabezado Principal BPM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card-main border border-border-main p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase block mb-1">
            BUSINESS PROCESS MANAGEMENT
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            BPM Workflow Center
          </h1>
          <p className="text-sm text-text-muted mt-1 max-w-2xl">
            Monitoreo y modelación del ciclo de vida regulatorio. Controle cuellos de botella y transiciones de estados en tiempo real.
          </p>
        </div>
        <div className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono px-3.5 py-1.5 rounded-xl border border-emerald-500/20 font-bold flex items-center gap-2 self-stretch md:self-auto justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Motor BPM Activo v2.4
        </div>
      </div>

      {/* Flujo Visual Interactivo (Tubería BPM de 5 Pasos) */}
      <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-border-main pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono">
              Tubería de Calidad Reguladora (BPM Pipeline)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Haga clic sobre cualquier fase para visualizar sus detalles operativos e indicadores clave.
            </p>
          </div>
          <span className="text-xs bg-bg-inner text-text-muted border border-border-main px-3 py-1 rounded-md font-mono select-none">
            5 Pasos Secuenciales
          </span>
        </div>

        {/* Pipeline horizontal */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 relative">
          {bpmSteps.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            const isUpcoming = idx > activeStep;

            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer flex flex-col justify-between min-h-[160px] group ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                    : "border-border-main bg-bg-inner/50 hover:bg-bg-hover"
                }`}
              >
                {/* Connector Arrow (Hidden on mobile) */}
                {idx < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20 pointer-events-none">
                    <svg
                      className={`w-6 h-6 ${isCompleted ? "text-emerald-500" : "text-border-main"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">{step.icon}</span>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-indigo-600 text-white animate-pulse"
                          : isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-bg-inner text-text-muted border border-border-main"
                      }`}
                    >
                      {isActive ? "EN PROCESO" : isCompleted ? "COMPLETADO" : "PENDIENTE"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-text-main font-mono tracking-tight group-hover:text-indigo-500 transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-text-muted font-medium">{step.subtitle}</p>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted mt-3 leading-snug font-mono">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Métricas de Cuellos de Botella e Historial BPM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo (1 Columna): Tiempos de Demora por Área */}
        <div className="lg:col-span-1 bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-border-main pb-4">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Rendimiento por Área
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Detección preventiva de cuellos de botella regulatorios.
            </p>
          </div>

          <div className="space-y-4">
            {areaPerformance.map((item, idx) => (
              <div key={idx} className="p-4 bg-bg-inner border border-border-main rounded-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-text-main leading-tight truncate">{item.area}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      item.status === "EXCELENTE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-main/50 text-[10px] text-text-muted">
                  <div>
                    <span className="block text-[8px] uppercase">En Cola:</span>
                    <span className="text-sm font-bold text-text-main">{item.activeReports} Reps</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">Espera Prom:</span>
                    <span className="text-sm font-bold text-text-main">{item.avgDelayHours}h</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">A Tiempo:</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.onTimeRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SLA Warning */}
          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
            <p className="text-[11px] text-text-muted leading-tight font-mono">
              ⚠️ El Acuerdo de Nivel de Servicio (SLA) máximo es de <strong>24 horas</strong> antes del vencimiento circular.
            </p>
          </div>
        </div>

        {/* Panel Derecho (2 Columnas): Bitácora Audit-Trail BPM */}
        <div className="lg:col-span-2 bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="border-b border-border-main pb-4 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
                Bitácora Transicional BPMN (Audit-Trail)
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Historial inmutable de estados y autorizaciones regulatorias cruzadas.
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded bg-indigo-500/5">
              Live Feed
            </span>
          </div>

          {/* Logs timeline list */}
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {logs.map((log, index) => {
              // Icon selector
              let badgeStyle = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
              let icon = "⚪";
              if (log.type === "SUBMISSION") {
                badgeStyle = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
                icon = "📤";
              } else if (log.type === "REJECTION") {
                badgeStyle = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
                icon = "❌";
              } else if (log.type === "ALERT") {
                badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                icon = "🚨";
              } else if (log.type === "EXTRACTION") {
                badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                icon = "⚙️";
              }

              return (
                <div key={index} className="p-4 bg-bg-inner border border-border-main rounded-xl flex items-start gap-4 hover:bg-bg-hover transition-colors">
                  {/* Icon badge */}
                  <div className="text-xl shrink-0 p-1.5 bg-card-main border border-border-main rounded-lg shadow-inner">
                    {icon}
                  </div>

                  <div className="flex-1 space-y-1 font-mono text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-main text-sm">{log.event}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeStyle}`}>
                          {log.report}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted">{log.time}</span>
                    </div>

                    <p className="text-text-muted text-xs leading-relaxed">{log.description}</p>
                    
                    <div className="pt-2 flex justify-between items-center text-[10px] text-text-muted border-t border-border-main/20">
                      <span>Iniciador: <strong>{log.user}</strong></span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px]">Transición OK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
