"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateCell } from "@/lib/xsdValidator";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  areaId: number | null;
  area: { id: number; name: string } | null;
}

interface Report {
  id: number;
  reportCode: string;
  status: string;
  dataJson: string;
  generatedXml: string | null;
  createdAt: string;
  creatorId: number;
  creatorName: string;
  areaId: number;
  area: { id: number; name: string };
  mapping: { id: number; name: string; fieldMappings: string } | null;
  approvals: { id: number; userId: number; approvedAt: string; user: { name: string; email: string } }[];
  comments: { id: number; content: string; createdAt: string; user: { name: string; role: string } }[];
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: reportId } = React.use(params);

  const [report, setReport] = useState<Report | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Interface control states
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; fieldKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingData, setSavingData] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Active selected cell for detail display
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; fieldKey: string; error?: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [reportId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resReport, resUser] = await Promise.all([
        fetch(`/api/reports/${reportId}`),
        fetch("/api/auth/me"),
      ]);

      if (resReport.ok) {
        const data = await resReport.json();
        setReport(data.report);
        setRows(data.rows);
        setErrors(data.errors);
      } else {
        router.push("/reports");
      }

      if (resUser.ok) {
        const userData = await resUser.json();
        if (userData.authenticated) {
          setCurrentUser(userData.user);
        }
      }
    } catch (err) {
      console.error("Error loading report details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cell editing triggers
  const startEditing = (rowIndex: number, fieldKey: string, currentValue: any) => {
    // Check editing permissions
    if (report?.status !== "DRAFT" && report?.status !== "REJECTED" && currentUser?.role !== "ADMIN") {
      return; // Read-only mode if not draft/rejected
    }
    setEditingCell({ rowIndex, fieldKey });
    setEditValue(String(currentValue !== null && currentValue !== undefined ? currentValue : ""));
  };

  const handleCellSave = () => {
    if (!editingCell || !report) return;

    const { rowIndex, fieldKey } = editingCell;
    const updatedRows = [...rows];
    
    // Parse value if it represents integer to avoid type mismatch
    let parsedValue: any = editValue.trim();
    
    // Convert to number if it fits the schema type
    const mapping = report.mapping;
    if (mapping) {
      const fieldMappings = JSON.parse(mapping.fieldMappings || "{}");
      // Find what XSD tag this column represents
      const xsdTag = Object.keys(fieldMappings).find((k) => fieldMappings[k] === fieldKey) || fieldKey;
      
      // Perform dynamic cell-level validation on the fly locally
      const validation = validateCell(report.reportCode, xsdTag, parsedValue);

      // Update errors state dynamically
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (!validation.isValid && validation.message) {
          newErrors[rowIndex] = {
            ...(newErrors[rowIndex] || {}),
            [xsdTag]: validation.message,
          };
          // Highlight active cell details instantly
          setActiveCell({ rowIndex, fieldKey, error: validation.message });
        } else {
          if (newErrors[rowIndex]) {
            delete newErrors[rowIndex][xsdTag];
            if (Object.keys(newErrors[rowIndex]).length === 0) {
              delete newErrors[rowIndex];
            }
          }
          setActiveCell(null);
        }
        return newErrors;
      });
    }

    updatedRows[rowIndex][fieldKey] = parsedValue;
    setRows(updatedRows);
    setEditingCell(null);
  };

  const handleSaveToDatabase = async () => {
    setSavingData(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (res.ok) {
        alert("💾 Borrador guardado correctamente en la base de datos.");
      } else {
        const data = await res.json();
        alert(`Error al guardar: ${data.error}`);
      }
    } catch (err) {
      alert("Error de red al guardar.");
    } finally {
      setSavingData(false);
    }
  };

  const handleWorkflowAction = async (action: string, payload?: any) => {
    setWorkflowLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fallo en la operación.");
      }

      setShowRejectModal(false);
      setRejectComment("");
      fetchInitialData(); // Refresh UI State
      
      if (action === "approve" && data.isFullyApproved) {
        alert("🎉 ¡Firma agregada con éxito! Reporte completamente aprobado. XML generado.");
      } else if (action === "approve") {
        alert("✍️ Firma agregada. Aprobación parcial concedida.");
      } else if (action === "submit") {
        alert("📤 Reporte enviado a revisión con éxito.");
      } else if (action === "reject") {
        alert("❌ Reporte devuelto a borrador con comentarios.");
      }
    } catch (err: any) {
      alert(`Error en flujo: ${err.message}`);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleDownloadXml = () => {
    if (!report || !report.generatedXml) return;

    // Create a blob with the XML content
    const blob = new Blob([report.generatedXml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SSF_${report.reportCode}_${new Date().toISOString().slice(0,10)}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <svg className="animate-spin h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-400 text-sm font-mono animate-pulse">Compilando datos y validando esquema regulatorio...</span>
      </div>
    );
  }

  if (!report) return null;

  // Total error count
  const errorCount = Object.values(errors).reduce((acc, rowErr) => acc + Object.keys(rowErr).length, 0);

  // SQL Column keys from mappings
  const fieldMappings = report.mapping ? JSON.parse(report.mapping.fieldMappings || "{}") : {};
  const sqlColumns = Object.values(fieldMappings) as string[];

  // Workflow states permissions checks
  const isCreator = report.creatorId === currentUser?.id;
  const isApprover = currentUser?.role === "APPROVER" && currentUser?.areaId === report.areaId;
  const isAdmin = currentUser?.role === "ADMIN";
  const isDraft = report.status === "DRAFT" || report.status === "REJECTED";
  const isPendingReview = report.status === "PENDING_APPROVAL";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fade-in relative">
      
      {/* SECCIÓN IZQUIERDA: Encabezado y Tabla de Datos */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Header de Metadatos */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-extrabold text-text-main tracking-tight font-mono">
                Reporte {report.reportCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-bg-inner text-text-muted border border-border-main">
                ID #{report.id}
              </span>
              {report.status === "APPROVED" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  APROBADO
                </span>
              )}
              {report.status === "PENDING_APPROVAL" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                  EN REVISIÓN
                </span>
              )}
              {report.status === "DRAFT" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  BORRADOR
                </span>
              )}
              {report.status === "REJECTED" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  RECHAZADO
                </span>
              )}
            </div>
            <p className="text-text-muted text-xs font-mono">
              Extraído el {new Date(report.createdAt).toLocaleString("es-CO")} por{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{report.creatorName}</span>
            </p>
          </div>

          {/* Botones de acción del Preparador (Guardar Borrador) */}
          {isDraft && (isCreator || isAdmin) && (
            <button
              onClick={handleSaveToDatabase}
              disabled={savingData}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {savingData ? "Guardando..." : "Guardar Cambios Local"}
            </button>
          )}

          {/* Botón de Descarga XML cuando está aprobado */}
          {report.status === "APPROVED" && (
            <button
              onClick={handleDownloadXml}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer font-mono tracking-wide"
            >
              📥 DESCARGAR XML FINAL
            </button>
          )}
        </div>

        {/* Tubería Visual BPM */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-border-main pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Tubería de Calidad BPM (Estado del Proceso)
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Seguimiento del ciclo de vida del reporte regulatorio</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-600/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
              {report.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
            {/* Paso 1: Extracción */}
            <div className="p-3 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-xl flex flex-col justify-between min-h-[90px] font-mono text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-lg">📥</span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">OK</span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-text-main text-xs">1. Extracción</h5>
                <p className="text-text-muted mt-0.5">Conexión Establecida</p>
              </div>
            </div>

            {/* Paso 2: Auditoría XSD */}
            <div className={`p-3 border rounded-xl flex flex-col justify-between min-h-[90px] font-mono text-[10px] ${
              errorCount > 0
                ? "bg-rose-500/5 border-rose-500/30"
                : "bg-emerald-500/[0.03] border-emerald-500/20"
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-lg">🔴</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                  errorCount > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                }`}>
                  {errorCount > 0 ? `${errorCount} ERRORES` : "SIN ERRORES"}
                </span>
              </div>
              <div className="mt-2">
                <h5 className="font-bold text-text-main text-xs">2. Auditoría XSD</h5>
                <p className="text-text-muted mt-0.5">Esquema Regulatorio</p>
              </div>
            </div>

            {/* Paso 3: Corrección */}
            {(() => {
              const isCorrectionActive = (report.status === "DRAFT" || report.status === "REJECTED") && errorCount > 0;
              const isCorrectionCompleted = report.status === "PENDING_APPROVAL" || report.status === "APPROVED" || ((report.status === "DRAFT" || report.status === "REJECTED") && errorCount === 0);
              
              return (
                <div className={`p-3 border rounded-xl flex flex-col justify-between min-h-[90px] font-mono text-[10px] ${
                  isCorrectionActive
                    ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/10"
                    : isCorrectionCompleted
                    ? "bg-emerald-500/[0.03] border-emerald-500/20"
                    : "border-border-main bg-bg-inner/50"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">✍️</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      isCorrectionActive
                        ? "bg-indigo-600 text-white animate-pulse"
                        : isCorrectionCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-bg-inner text-text-muted border-border-main"
                    }`}>
                      {isCorrectionActive ? "ACTIVO" : isCorrectionCompleted ? "COMPLETADO" : "PENDIENTE"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h5 className="font-bold text-text-main text-xs">3. Corrección</h5>
                    <p className="text-text-muted mt-0.5">
                      {errorCount > 0 ? "Errores Pendientes" : "Hoja Conforme"}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Paso 4: Firma Multinivel */}
            {(() => {
              const isFirmaActive = report.status === "PENDING_APPROVAL";
              const isFirmaCompleted = report.status === "APPROVED";
              
              return (
                <div className={`p-3 border rounded-xl flex flex-col justify-between min-h-[90px] font-mono text-[10px] ${
                  isFirmaActive
                    ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/10"
                    : isFirmaCompleted
                    ? "bg-emerald-500/[0.03] border-emerald-500/20"
                    : "border-border-main bg-bg-inner/50"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">👥</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      isFirmaActive
                        ? "bg-indigo-600 text-white animate-pulse"
                        : isFirmaCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-bg-inner text-text-muted border-border-main"
                    }`}>
                      {isFirmaActive ? "REVISIÓN" : isFirmaCompleted ? "APROBADO" : "PENDIENTE"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h5 className="font-bold text-text-main text-xs">4. Firma</h5>
                    <p className="text-text-muted mt-0.5">
                      {isFirmaCompleted ? "Firmas Completas" : isFirmaActive ? `${report.approvals.length} / 1 Firmas` : "En Espera"}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Paso 5: Sello XML */}
            {(() => {
              const isSelloCompleted = report.status === "APPROVED";
              
              return (
                <div className={`p-3 border rounded-xl flex flex-col justify-between min-h-[90px] font-mono text-[10px] ${
                  isSelloCompleted
                    ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-md shadow-emerald-500/5"
                    : "border-border-main bg-bg-inner/50"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">📜</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                      isSelloCompleted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-bg-inner text-text-muted border-border-main"
                    }`}>
                      {isSelloCompleted ? "GENERADO" : "BLOQUEADO"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h5 className="font-bold text-text-main text-xs">5. Sello XML</h5>
                    <p className="text-text-muted mt-0.5">
                      {isSelloCompleted ? "XML Firmado Listo" : "Espera Aprobación"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Tabla Interactiva de Celdas */}
        <div className="bg-card-main border border-border-main rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-main bg-bg-inner flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-base font-bold text-text-main">Hoja de Trabajo Regulatoria</h3>
              <p className="text-xs text-text-muted mt-0.5">Doble clic sobre cualquier celda para corregir inconsistencias del XSD directamente</p>
            </div>
            <span className="text-xs font-mono text-text-muted bg-bg-inner px-3 py-1 rounded-md border border-border-main">
              {rows.length} Filas Cargadas
            </span>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse min-w-[1200px] text-xs">
              <thead>
                <tr className="border-b border-border-main bg-bg-inner text-text-muted font-mono tracking-wider sticky top-0 z-10">
                  <th className="px-3 py-3 w-12 text-center bg-bg-inner">Fila</th>
                  {sqlColumns.map((col) => {
                    // Find matching XSD tag for label
                    const xsdTag = Object.keys(fieldMappings).find((k) => fieldMappings[k] === col) || col;
                    return (
                      <th key={col} className="px-4 py-3 bg-bg-inner font-bold" title={xsdTag}>
                        <span className="block text-text-main">{xsdTag}</span>
                        <span className="block text-[10px] text-text-muted font-normal mt-0.5">{col}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-text-muted font-mono bg-card-main">
                {rows.map((row, rowIndex) => {
                  return (
                    <tr key={rowIndex} className="hover:bg-bg-hover transition-colors">
                      <td className="px-3 py-2 text-center bg-bg-inner font-semibold border-r border-border-main text-text-muted select-none">
                        {rowIndex + 1}
                      </td>

                      {sqlColumns.map((col) => {
                        const cellValue = row[col];
                        const xsdTag = Object.keys(fieldMappings).find((k) => fieldMappings[k] === col) || col;
                        const cellError = errors[rowIndex]?.[xsdTag];
                        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.fieldKey === col;

                        return (
                          <td
                            key={col}
                            onDoubleClick={() => startEditing(rowIndex, col, cellValue)}
                            onClick={() => setActiveCell({ rowIndex, fieldKey: col, error: cellError })}
                            className={`px-4 py-2 border-r border-border-main transition-all relative ${
                              cellError
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border-rose-500/30"
                                : "hover:bg-bg-hover"
                            } ${isEditing ? "p-0" : "cursor-pointer"}`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCellSave();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                className="w-full px-4 py-2 bg-bg-inner border border-indigo-500 text-text-main text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate max-w-[180px]">{cellValue !== null && cellValue !== undefined ? String(cellValue) : ""}</span>
                                {cellError && (
                                  <svg className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Sidebar de Control y Compliance */}
      <div className="xl:col-span-1 space-y-6">
        
        {/* Panel A: Acciones del Flujo de Trabajo */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="border-b border-border-main pb-3">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Control de Firmas
            </h3>
            <p className="text-xs text-text-muted mt-1">Gestión del ciclo de aprobación oficial</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-muted">Área Destino:</span>
              <span className="text-text-main font-bold">{report.area.name}</span>
            </div>

            {/* Timeline de aprobaciones firmadas */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Firmas Obtenidas:</span>
              {report.approvals.length === 0 ? (
                <span className="text-xs text-text-muted italic block py-1 font-mono">Ningún revisor ha firmado aún</span>
              ) : (
                <div className="space-y-2">
                  {report.approvals.map((app) => (
                    <div key={app.id} className="p-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="block font-bold text-emerald-600 dark:text-emerald-400 font-mono">{app.user.name.split(" ")[0]}</span>
                        <span className="block text-[9px] text-text-muted">{app.user.email}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 font-bold">FIRMADO</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones dinámicos basados en Rol y Estado */}
          <div className="pt-4 border-t border-border-main space-y-3">
            {/* ANALISTA: Enviar a revisión */}
            {isDraft && (isCreator || isAdmin) && (
              <button
                onClick={() => handleWorkflowAction("submit")}
                disabled={workflowLoading || errorCount > 0}
                className={`w-full py-3 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  errorCount > 0
                    ? "bg-bg-inner border border-border-main text-text-muted cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95"
                }`}
              >
                📤 ENVIAR A REVISIÓN
              </button>
            )}

            {errorCount > 0 && isDraft && (
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono text-center leading-tight">
                ⚠️ Corrija las {errorCount} inconsistencias XSD antes de enviar a revisión.
              </p>
            )}

            {/* APROBADOR: Firmar o Rechazar */}
            {isPendingReview && (isApprover || isAdmin) && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={workflowLoading}
                  className="py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  ❌ RECHAZAR
                </button>
                <button
                  onClick={() => handleWorkflowAction("approve")}
                  disabled={workflowLoading}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  ✍️ FIRMAR OK
                </button>
              </div>
            )}

            {!isApprover && isPendingReview && currentUser?.role === "ANALYST" && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-center">
                <p className="text-[11px] text-amber-600 dark:text-amber-300 font-mono">
                  En espera de aprobación del área. Solo revisores autorizados pueden firmar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel B: Detalle de Celda Seleccionada y Compliance XSD */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-border-main pb-3">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Auditoría de Cumplimiento
            </h3>
            <p className="text-xs text-text-muted mt-1">Validación contra reglas oficiales de la SSF</p>
          </div>

          {/* Contador de Errores */}
          <div className="p-4 bg-bg-inner border border-border-main rounded-xl flex items-center justify-between">
            <span className="text-text-muted text-xs font-semibold">Total Inconsistencias:</span>
            {errorCount > 0 ? (
              <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full font-bold text-sm font-mono">
                {errorCount} Errores
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm font-mono">
                0 Errores (Correcto)
              </span>
            )}
          </div>

          {/* Detalle de celda activa */}
          <div className="p-4 bg-bg-inner border border-border-main rounded-xl space-y-2 min-h-[120px] flex flex-col justify-center">
            {activeCell ? (
              <div className="space-y-1.5 font-mono text-xs">
                <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Detalle del Campo Seleccionado:</span>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fila:</span>
                  <span className="text-text-main font-bold">{activeCell.rowIndex + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Etiqueta:</span>
                  <span className="text-text-main font-bold">{activeCell.fieldKey}</span>
                </div>
                {activeCell.error ? (
                  <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-700 dark:text-rose-300 text-[11px] leading-tight">
                    ⚠️ {activeCell.error}
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-[11px] leading-tight">
                    ✅ Campo conforme con la longitud y restricciones del XSD.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center italic font-mono">
                Haga clic sobre cualquier celda de la hoja para auditar sus especificaciones técnicas de forma dinámica.
              </p>
            )}
          </div>
        </div>

        {/* Panel C: Comentarios / Bitácora */}
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-border-main pb-3">
            <h3 className="text-base font-bold text-text-main uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
              Bitácora de Observaciones
            </h3>
            <p className="text-xs text-text-muted mt-1">Historial del proceso e intercambios</p>
          </div>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {report.comments.length === 0 ? (
              <p className="text-xs text-text-muted text-center italic font-mono py-4">Sin observaciones en este reporte</p>
            ) : (
              report.comments.map((com) => (
                <div key={com.id} className="p-3 bg-bg-inner border border-border-main rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span className="font-bold text-text-main">{com.user.name.split(" ")[0]}</span>
                    <span>{new Date(com.createdAt).toLocaleString("es-CO", { hour: "numeric", minute: "numeric" })}</span>
                  </div>
                  <p className="text-text-main leading-normal">{com.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal de Comentario de Rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-main border border-border-main rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="border-b border-border-main pb-4 mb-4">
              <h3 className="text-lg font-bold text-text-main">Devolución de Reporte</h3>
              <p className="text-xs text-text-muted mt-1">Describa las razones del rechazo para informar al analista</p>
            </div>

            {rejectError && (
              <div className="mb-4 p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-300 text-xs text-center">
                ⚠️ {rejectError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                  Observaciones / Correcciones requeridas
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ej: Se detectó un valor negativo erróneo en los aportes de la fila 4..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectComment("");
                    setRejectError(null);
                  }}
                  className="px-4 py-2 bg-bg-inner hover:bg-bg-hover text-text-main border border-border-main rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!rejectComment.trim()) {
                      setRejectError("Debe escribir una observación para justificar el rechazo.");
                      return;
                    }
                    handleWorkflowAction("reject", { comment: rejectComment });
                  }}
                  disabled={workflowLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/20 cursor-pointer"
                >
                  {workflowLoading ? "Procesando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
