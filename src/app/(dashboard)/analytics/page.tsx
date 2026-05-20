"use client";

import React, { useState } from "react";

// Mock reports data for the interactive analytics
const reportsData = {
  "2-001A": {
    name: "Autoliquidación de Aportes de Empleadores",
    complianceRate: 92.5,
    resolvedErrors: 18,
    activeAlerts: 3,
    totalVolume: "$ 68,800,000 COP",
    inconsistencies: [
      { category: "Longitud de Campo", count: 8, pct: 40, color: "from-amber-500 to-orange-500" },
      { category: "Tipo de Dato", count: 6, pct: 30, color: "from-rose-500 to-red-500" },
      { category: "Campos Requeridos", count: 4, pct: 20, color: "from-indigo-500 to-blue-500" },
      { category: "Otros Inconsistencias", count: 2, pct: 10, color: "from-slate-400 to-slate-500" },
    ],
    trend: [
      { label: "Dic", valid: 85, invalid: 15 },
      { label: "Ene", valid: 88, invalid: 12 },
      { label: "Feb", valid: 90, invalid: 10 },
      { label: "Mar", valid: 89, invalid: 11 },
      { label: "Abr", valid: 91, invalid: 9 },
      { label: "May", valid: 93, invalid: 7 },
    ],
  },
  "2-002A": {
    name: "Presupuesto y Gasto de Caja de Compensación",
    complianceRate: 96.2,
    resolvedErrors: 10,
    activeAlerts: 1,
    totalVolume: "$ 17,000,000,000 COP",
    inconsistencies: [
      { category: "Tipo de Dato (Negativos)", count: 5, pct: 50, color: "from-rose-500 to-red-500" },
      { category: "Campos Requeridos", count: 3, pct: 30, color: "from-indigo-500 to-blue-500" },
      { category: "Longitud de Campo", count: 2, pct: 20, color: "from-amber-500 to-orange-500" },
    ],
    trend: [
      { label: "Dic", valid: 90, invalid: 10 },
      { label: "Ene", valid: 92, invalid: 8 },
      { label: "Feb", valid: 94, invalid: 6 },
      { label: "Mar", valid: 95, invalid: 5 },
      { label: "Abr", valid: 93, invalid: 7 },
      { label: "May", valid: 96, invalid: 4 },
    ],
    budgetComparison: [
      {
        concept: "1010 - Sueldos y Salarios",
        presupuesto: 5000000000,
        ejecutado: 4800000000,
        status: "OK",
        statusText: "Ejecutado dentro del límite",
        color: "emerald",
      },
      {
        concept: "1020 - Subsidio Familiar",
        presupuesto: 12000000000,
        ejecutado: -150000000,
        status: "ERROR",
        statusText: "Valor negativo no permitido por XSD",
        color: "rose",
      },
    ],
  },
};

export default function AnalyticsStudioPage() {
  const [selectedReportId, setSelectedReportId] = useState<"2-001A" | "2-002A">("2-001A");
  const data = reportsData[selectedReportId];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-8 p-1 animate-fade-in text-text-main">
      {/* Encabezado Principal Looker-Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card-main border border-border-main p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase block mb-1">
            BI & ANALYTICS STUDIO
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Looker Analytics Studio
          </h1>
          <p className="text-sm text-text-muted mt-1 max-w-2xl">
            Tableros interactivos e indicadores de calidad en tiempo real basados en los reportes regulatorios extraídos de las bases federadas.
          </p>
        </div>

        {/* Report Selector Switcher */}
        <div className="flex items-center gap-2 bg-bg-inner p-1.5 rounded-xl border border-border-main self-stretch md:self-auto">
          <button
            onClick={() => setSelectedReportId("2-001A")}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wide transition-all ${
              selectedReportId === "2-001A"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-text-muted hover:text-text-main hover:bg-bg-hover"
            }`}
          >
            📊 Reporte 2-001A
          </button>
          <button
            onClick={() => setSelectedReportId("2-002A")}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wide transition-all ${
              selectedReportId === "2-002A"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-text-muted hover:text-text-main hover:bg-bg-hover"
            }`}
          >
            💼 Reporte 2-002A
          </button>
        </div>
      </div>

      {/* Tarjeta Informativa del Reporte Activo */}
      <div className="bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 border border-indigo-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
            Reporte Activo: {selectedReportId}
          </h2>
          <p className="text-sm text-text-muted font-mono mt-0.5">{data.name}</p>
        </div>
        <div className="text-xs bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-mono px-3.5 py-1.5 rounded-full border border-indigo-500/20 font-bold">
          Actualizado hace unos instantes
        </div>
      </div>

      {/* Grid de KPIs Clave (4 Columnas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Tasa de Conformidad */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
                Tasa Conformidad
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-text-main">
                {data.complianceRate}%
              </div>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {/* Progress bar inside card */}
          <div className="w-full bg-bg-inner h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${data.complianceRate}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-text-muted mt-2 block font-mono">
            Meta regulatoria de la SSF: &gt;95%
          </span>
        </div>

        {/* KPI 2: Errores Resueltos */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
                Correciones XSD
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-text-main">
                {data.resolvedErrors}
              </div>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-bg-inner h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "75%" }}></div>
          </div>
          <span className="text-[10px] text-text-muted mt-2 block font-mono">
            Resueltos en Hoja de Trabajo interactiva
          </span>
        </div>

        {/* KPI 3: Alertas Activas */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
                Alertas Activas
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
                {data.activeAlerts}
              </div>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500 dark:text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-bg-inner h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-rose-500 h-2 rounded-full"
              style={{ width: `${data.activeAlerts * 25}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-text-muted mt-2 block font-mono">
            Bloquean firmas en BPM hasta corregirse
          </span>
        </div>

        {/* KPI 4: Volumen Consolidado */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">
                Volumen Financiero
              </span>
              <div className="text-lg font-black font-mono tracking-tight text-text-main truncate max-w-[170px]" title={data.totalVolume}>
                {data.totalVolume}
              </div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 dark:text-amber-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-bg-inner h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: "90%" }}></div>
          </div>
          <span className="text-[10px] text-text-muted mt-2 block font-mono">
            Unificado mediante Joins federados
          </span>
        </div>
      </div>

      {/* Segunda Fila: Gráficos de Inconsistencias (SVG) & Tendencias de Envío (Bar CSS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel Izquierdo: Gráfico Radial de Inconsistencias XSD */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="border-b border-border-main pb-4 mb-4">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Inconsistencias XSD Detectadas
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Desglose porcentual y numérico por tipo de regla del esquema XSD de la Superintendencia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 justify-around py-4">
            {/* SVG Donut / Radial Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                {/* Background Ring */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--card-border)" strokeWidth="3"></circle>
                
                {/* Sector A: Longitud de Campo */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#f59e0b" // amber-500
                  strokeWidth="3.2"
                  strokeDasharray={`${data.inconsistencies[0]?.pct || 0} ${100 - (data.inconsistencies[0]?.pct || 0)}`}
                  strokeDashoffset="0"
                ></circle>

                {/* Sector B: Tipo de Dato */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#f43f5e" // rose-500
                  strokeWidth="3.2"
                  strokeDasharray={`${data.inconsistencies[1]?.pct || 0} ${100 - (data.inconsistencies[1]?.pct || 0)}`}
                  strokeDashoffset={`-${data.inconsistencies[0]?.pct || 0}`}
                ></circle>

                {/* Sector C: Requeridos */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#6366f1" // indigo-500
                  strokeWidth="3.2"
                  strokeDasharray={`${data.inconsistencies[2]?.pct || 0} ${100 - (data.inconsistencies[2]?.pct || 0)}`}
                  strokeDashoffset={`-${(data.inconsistencies[0]?.pct || 0) + (data.inconsistencies[1]?.pct || 0)}`}
                ></circle>

                {/* Sector D: Otros */}
                {data.inconsistencies[3] && (
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="#94a3b8" // slate-400
                    strokeWidth="3.2"
                    strokeDasharray={`${data.inconsistencies[3]?.pct || 0} ${100 - (data.inconsistencies[3]?.pct || 0)}`}
                    strokeDashoffset={`-${(data.inconsistencies[0]?.pct || 0) + (data.inconsistencies[1]?.pct || 0) + (data.inconsistencies[2]?.pct || 0)}`}
                  ></circle>
                )}
              </svg>
              {/* Inner compliance text */}
              <div className="absolute text-center">
                <span className="block text-2xl font-black font-mono leading-none">{data.complianceRate}%</span>
                <span className="text-[9px] text-text-muted uppercase font-bold font-mono tracking-widest mt-1 block">Conforme</span>
              </div>
            </div>

            {/* List labels legend */}
            <div className="space-y-3 flex-1 w-full font-mono text-xs">
              {data.inconsistencies.map((inc, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="flex items-center gap-2 text-text-main font-semibold">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          i === 0
                            ? "bg-amber-500"
                            : i === 1
                            ? "bg-rose-500"
                            : i === 2
                            ? "bg-indigo-500"
                            : "bg-slate-400"
                        }`}
                      ></span>
                      {inc.category}
                    </span>
                    <span className="font-bold text-text-main">
                      {inc.count} ({inc.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-bg-inner h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${inc.color}`}
                      style={{ width: `${inc.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Tendencia de Envío Histórico */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="border-b border-border-main pb-4 mb-4">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Tendencia de Calidad Temporal
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Comparativo de porcentaje de registros válidos (verde) vs. rechazados/inconsistentes (rojo) en las últimas extracciones.
            </p>
          </div>

          {/* Bar Chart using CSS Columns */}
          <div className="flex items-end justify-between h-48 px-2 py-4 border-b border-border-main gap-2">
            {data.trend.map((t, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                
                {/* Dynamic tooltip on hover */}
                <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 w-24 pointer-events-none font-mono">
                  <div className="font-bold border-b border-white/20 pb-0.5 mb-1">{t.label}</div>
                  <div className="text-emerald-400">Válidos: {t.valid}%</div>
                  <div className="text-rose-400">Erróneos: {t.invalid}%</div>
                </div>

                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  {/* Valid bar */}
                  <div
                    className="w-4 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${t.valid}%` }}
                    title={`Válidos: ${t.valid}%`}
                  ></div>
                  {/* Invalid bar */}
                  <div
                    className="w-4 bg-rose-500/80 hover:bg-rose-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${t.invalid}%` }}
                    title={`Erróneos: ${t.invalid}%`}
                  ></div>
                </div>
                
                <span className="text-[10px] font-bold text-text-muted font-mono">{t.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-4 text-[10px] font-bold font-mono text-text-muted">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              REGISTROS VÁLIDOS (%)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
              REGISTROS INCORRECTOS (%)
            </span>
          </div>
        </div>
      </div>

      {/* Tercera Fila: Vista Especial de Presupuesto para Reporte 2-002A */}
      {selectedReportId === "2-002A" && (
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="border-b border-border-main pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="p-1 bg-rose-500/10 rounded">⚠️</span>
                Comparativa Financiera & Alertador XSD
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Regla XSD: El valor ejecutado del subsidio y salarios no puede ser negativo ni superior al total del presupuesto.
              </p>
            </div>
            <span className="text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full font-mono font-bold">
              1 Alerta Crítica Detectada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reportsData["2-002A"].budgetComparison?.map((item, idx) => (
              <div
                key={idx}
                className={`p-6 border rounded-2xl space-y-4 relative overflow-hidden bg-bg-inner ${
                  item.status === "ERROR"
                    ? "border-rose-500/20 bg-rose-500/5"
                    : "border-border-main"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono block">
                      Concepto Evaluado
                    </span>
                    <h4 className="text-base font-bold text-text-main mt-0.5 font-mono">{item.concept}</h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono ${
                      item.status === "ERROR"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-text-muted">
                    <span>Ejecución del Presupuesto</span>
                    <span className="text-text-main font-bold">
                      {item.status === "ERROR"
                        ? "ERROR NEGATIVO (-1.25%)"
                        : `${((item.ejecutado / item.presupuesto) * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-bg-inner h-3 rounded-full overflow-hidden border border-border-main">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === "ERROR"
                          ? "bg-rose-500 animate-pulse"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: item.status === "ERROR" ? "100%" : `${(item.ejecutado / item.presupuesto) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Figures comparison */}
                <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs border-t border-border-main">
                  <div>
                    <span className="block text-text-muted text-[10px] uppercase">Presupuesto Inicial:</span>
                    <span className="text-sm font-bold text-text-main">{formatCurrency(item.presupuesto)}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted text-[10px] uppercase">Ejecutado a la Fecha:</span>
                    <span
                      className={`text-sm font-bold ${
                        item.status === "ERROR" ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatCurrency(item.ejecutado)}
                    </span>
                  </div>
                </div>

                {/* Bottom status alert box */}
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 text-xs ${
                    item.status === "ERROR"
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  }`}
                >
                  <span className="text-base shrink-0">{item.status === "ERROR" ? "🚨" : "✅"}</span>
                  <p className="leading-tight font-medium font-mono">{item.statusText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
