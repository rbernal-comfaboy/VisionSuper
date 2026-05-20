"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Area {
  id: number;
  name: string;
}

interface Mapping {
  id: number;
  name: string;
  reportCode: string;
}

interface Report {
  id: number;
  reportCode: string;
  status: string;
  createdAt: string;
  creatorName: string;
  area: Area;
  mapping: Mapping | null;
}

export default function ReportsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resReports, resMappings, resAreas] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/mappings"),
        fetch("/api/areas"),
      ]);

      if (resReports.ok) {
        const data = await resReports.json();
        setReports(data);
      }

      if (resMappings.ok) {
        const data = await resMappings.json();
        setMappings(data);
        if (data.length > 0) {
          setSelectedMapping(String(data[0].id));
        }
      }

      if (resAreas.ok) {
        const data = await resAreas.json();
        setAreas(data);
        if (data.length > 0) {
          setSelectedArea(String(data[0].id));
        }
      }
    } catch (err) {
      console.error("Error loading reports view data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappingId: selectedMapping,
          areaId: selectedArea,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fallo al procesar la extracción.");
      }

      // Redirigir directamente al editor de celdas interactivo
      router.push(`/reports/${data.id}`);
    } catch (err: any) {
      setExtractError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Borrador
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Revisión Pendiente
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Aprobado (XML Listo)
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-bg-inner text-text-muted border border-border-main">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">
            Extracción y Reportes
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Visualice los reportes generados a partir de los orígenes de datos, audite su cumplimiento XSD y administre su aprobación.
          </p>
        </div>

        <button
          onClick={() => {
            if (mappings.length === 0) {
              alert("Por favor registre un mapeo SQL-XSD antes de realizar una extracción.");
              return;
            }
            setShowModal(true);
            setExtractError(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Nueva Extracción SQL
        </button>
      </div>

      {/* Modal Nueva Extracción */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-main border border-border-main rounded-2xl p-6 w-full max-w-lg shadow-2xl relative animate-scale-up">
            <div className="border-b border-border-main pb-4 mb-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text-main">Iniciar Extracción Regulada</h3>
                <p className="text-xs text-text-muted mt-1">Conectará dinámicamente a la BD operacional origen</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-main p-1 hover:bg-bg-hover rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {extractError && (
              <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-sm text-center">
                ⚠️ {extractError}
              </div>
            )}

            <form onSubmit={handleExtract} className="space-y-6">
              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                  Plantilla de Mapeo SQL-XSD
                </label>
                <select
                  required
                  value={selectedMapping}
                  onChange={(e) => setSelectedMapping(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:[&>option]:bg-slate-950 dark:[&>option]:text-white [&>option]:bg-white [&>option]:text-slate-900"
                >
                  {mappings.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.reportCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                  Área Destinataria del Reporte
                </label>
                <select
                  required
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:[&>option]:bg-slate-950 dark:[&>option]:text-white [&>option]:bg-white [&>option]:text-slate-900"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border-main pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-bg-inner hover:bg-bg-hover text-text-main border border-border-main rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={extracting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {extracting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Extrayendo...
                    </>
                  ) : (
                    "Ejecutar y Validar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Reportes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-text-muted text-sm font-mono">Consolidando historial de reportes...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card-main border border-border-main rounded-2xl p-12 text-center text-text-muted">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-text-main">No se registran reportes regulatorios</h3>
          <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">Seleccione "Nueva Extracción SQL" para consultar datos operativos, validar compliance e iniciar el flujo de firmas.</p>
        </div>
      ) : (
        <div className="bg-card-main border border-border-main rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-bg-inner text-text-muted font-mono text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Código Piloto</th>
                  <th className="px-6 py-4">Mapeo</th>
                  <th className="px-6 py-4">Área</th>
                  <th className="px-6 py-4">Fecha Extracción</th>
                  <th className="px-6 py-4">Preparador / Creador</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-sm text-text-muted">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-text-main">
                      {report.reportCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-main">
                      {report.mapping ? report.mapping.name : "Extracción Manual"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-bg-inner text-text-muted text-xs rounded border border-border-main font-medium">
                        {report.area.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-muted">
                      {new Date(report.createdAt).toLocaleString("es-CO")}
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">
                      {report.creatorName}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer"
                      >
                        Abrir Editor
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
