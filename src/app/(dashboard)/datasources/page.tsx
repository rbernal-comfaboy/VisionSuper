"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, FileSpreadsheet, Globe, ChevronRight, CheckCircle2, 
  UploadCloud, Link as LinkIcon, Save, ArrowRight, Server, Cloud, 
  Boxes, HardDrive, Flame, Box, Zap, FileText, FileCode, Braces,
  Settings, HelpCircle, RefreshCw, Plus, Trash2, ArrowLeft, Network,
  AlertCircle, Table2, Layout, DatabaseZap, Search
} from 'lucide-react';

interface Connection {
  id: number;
  name: string;
  engine: string;
  isMock: boolean;
  database?: string | null;
  host?: string | null;
  port?: number | null;
  username?: string | null;
}

interface SemanticField {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "CURRENCY" | "PERCENTAGE" | "DATE" | "IDENTIFIER";
  category: "DIMENSION" | "MEASURE";
  aggregation?: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE";
  isCalculated?: boolean;
  formula?: string;
}

interface DataSource {
  id: number;
  name: string;
  description: string | null;
  connectionId: number;
  connection?: Connection;
  baseConfigJson: string;
  fieldsJson: string;
  createdAt: string;
}

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDs, setSelectedDs] = useState<DataSource | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProgress, setConnectingProgress] = useState(0);
  
    // State for preview modal visibility
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [dsName, setDsName] = useState("");
  const [dsDescription, setDsDescription] = useState("");
  const [dsConnectionId, setDsConnectionId] = useState("");
  const [baseConfigType, setBaseConfigType] = useState<"TABLE" | "CUSTOM_SQL">("TABLE");
  const [baseConfigQuery, setBaseConfigQuery] = useState("");
  const [fields, setFields] = useState<SemanticField[]>([]);

  // Calculated Field Creator states
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldId, setNewFieldId] = useState("");
  const [newFieldType, setNewFieldType] = useState<SemanticField["type"]>("NUMBER");
  const [newFieldFormula, setNewFieldFormula] = useState("");
  const [formulaError, setFormulaError] = useState<string | null>(null);

  // General form statuses
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dsRes, connRes] = await Promise.all([
        fetch("/api/datasources"),
        fetch("/api/connections"),
      ]);

      if (dsRes.ok && connRes.ok) {
        const dsData = await dsRes.json();
        const connData = await connRes.json();
        setDataSources(dsData);
        setConnections(connData);
      }
    } catch (err) {
      console.error("❌ Error fetching datasources or connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDs = (ds: DataSource) => {
    setSelectedDs(ds);
    setDsName(ds.name);
    setDsDescription(ds.description || "");
    setDsConnectionId(String(ds.connectionId));
    
    // Find matching connection
    const conn = connections.find(c => c.id === ds.connectionId);
    if (conn) {
      setSelectedConnection(conn);
    }

    try {
      const config = JSON.parse(ds.baseConfigJson || "{}");
      setBaseConfigType(config.type || "TABLE");
      setBaseConfigQuery(config.queryOrTable || "");
    } catch {
      setBaseConfigType("TABLE");
      setBaseConfigQuery("");
    }

    try {
      setFields(JSON.parse(ds.fieldsJson || "[]"));
    } catch {
      setFields([]);
    }

    // Go straight to Step 3 (Schema Editor) for editing
    setWizardStep(3);
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewRows([]);
  };

  const handleCreateNew = () => {
    setSelectedDs(null);
    setDsName("");
    setDsDescription("");
    setSelectedConnection(null);
    setDsConnectionId("");
    setBaseConfigType("TABLE");
    setBaseConfigQuery("dbo.cajas_presupuesto");
    setFields([]);
    
    // Start at Step 1 for wizard
    setWizardStep(1);
    setIsEditing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewRows([]);
  };

  const handleNextStep1 = () => {
    if (!selectedConnection) {
      setErrorMsg("Debe seleccionar una conexión de origen para continuar.");
      return;
    }
    setErrorMsg(null);
    if (!dsName) {
      setDsName(`Fuente Semántica - ${selectedConnection.name}`);
    }
    setWizardStep(2);
  };

  const handleConnectSource = async () => {
    if (!selectedConnection) {
      setErrorMsg("Error: No hay una conexión de origen seleccionada.");
      return;
    }
    if (!dsName.trim()) {
      setErrorMsg("Nombre de la Fuente es un campo requerido.");
      return;
    }

    setIsConnecting(true);
    setConnectingProgress(0);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Simulated progress loading
    const interval = setInterval(() => {
      setConnectingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const res = await fetch("/api/wizard/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedConnection.engine,
          database: selectedConnection.database || "mock_db",
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al leer metadatos del origen de datos.");
      }

      setConnectingProgress(100);
      setPreviewRows(data.previewData || []);

      // Infer fields if they aren't configured yet
      if (fields.length === 0) {
        const mappedFields: SemanticField[] = data.semanticFields.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type === "NUMBER" ? "NUMBER" : "TEXT",
          category: f.isMeasure ? "MEASURE" : "DIMENSION",
          aggregation: f.isMeasure ? "SUM" : undefined,
          isCalculated: false,
          formula: "",
        }));
        setFields(mappedFields);
      }

      setTimeout(() => {
        setIsConnecting(false);
        setWizardStep(3);
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setIsConnecting(false);
      setErrorMsg(err.message);
    }
  };

  const handleRefreshFields = async () => {
    if (!selectedConnection) return;
    setIsConnecting(true);
    setConnectingProgress(50);
    try {
      const res = await fetch("/api/wizard/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedConnection.engine,
          database: selectedConnection.database || "mock_db",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewRows(data.previewData || []);
        // Merging logic to avoid losing custom configurations or calculated fields
        const incomingIds = data.semanticFields.map((f: any) => f.id);
        const keptFields = fields.filter(f => f.isCalculated || incomingIds.includes(f.id));
        
        // Add new discovered fields
        const existingIds = keptFields.map(f => f.id);
        const newFields: SemanticField[] = data.semanticFields
          .filter((f: any) => !existingIds.includes(f.id))
          .map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type === "NUMBER" ? "NUMBER" : "TEXT",
            category: f.isMeasure ? "MEASURE" : "DIMENSION",
            aggregation: f.isMeasure ? "SUM" : undefined,
            isCalculated: false,
            formula: "",
          }));
        
        setFields([...keptFields, ...newFields]);
        setSuccessMsg("Campos sincronizados con éxito desde el origen físico.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        throw new Error(data.message || "Error al sincronizar campos.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddField = () => {
    const newField: SemanticField = {
      id: `campo_${fields.length + 1}`,
      name: `Nuevo Campo ${fields.length + 1}`,
      type: "TEXT",
      category: "DIMENSION",
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof SemanticField, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };

    if (key === "category") {
      if (value === "DIMENSION") {
        delete updated[index].aggregation;
      } else {
        updated[index].aggregation = "SUM";
      }
    }
    setFields(updated);
  };

  const validateFormula = (formula: string): boolean => {
    if (!formula.trim()) {
      setFormulaError("La fórmula no puede estar vacía.");
      return false;
    }
    const openBrackets = (formula.match(/\(/g) || []).length;
    const closeBrackets = (formula.match(/\(/g) || []).length;
    if (openBrackets !== closeBrackets) {
      setFormulaError("Los paréntesis no coinciden.");
      return false;
    }

    if (/[^a-zA-Z0-9_\s+\-*/()]/g.test(formula)) {
      setFormulaError("La fórmula contiene caracteres no permitidos. Use solo +, -, *, / y paréntesis.");
      return false;
    }

    setFormulaError(null);
    return true;
  };

  const handleAddCalculatedField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldId.trim()) {
      setFormulaError("El nombre y el ID técnico son requeridos.");
      return;
    }

    const techId = newFieldId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (fields.some(f => f.id === techId)) {
      setFormulaError(`El ID técnico '${techId}' ya está en uso.`);
      return;
    }

    if (!validateFormula(newFieldFormula)) {
      return;
    }

    const calculated: SemanticField = {
      id: techId,
      name: newFieldName.trim(),
      type: newFieldType,
      category: "MEASURE",
      aggregation: "NONE",
      isCalculated: true,
      formula: newFieldFormula.trim(),
    };

    setFields([...fields, calculated]);
    setShowFormulaModal(false);
    setNewFieldName("");
    setNewFieldId("");
    setNewFieldFormula("");
    setFormulaError(null);
  };

  const handleSave = async () => {
    if (!dsName.trim() || !dsConnectionId) {
      setErrorMsg("Nombre y Conexión son campos requeridos.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      name: dsName.trim(),
      description: dsDescription.trim(),
      connectionId: parseInt(dsConnectionId, 10),
      baseConfigJson: JSON.stringify({
        type: baseConfigType,
        queryOrTable: baseConfigQuery.trim(),
      }),
      fieldsJson: JSON.stringify(fields),
    };

    try {
      const url = selectedDs ? `/api/datasources/${selectedDs.id}` : "/api/datasources";
      const method = selectedDs ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la fuente de datos.");
      }

      setSuccessMsg("¡Fuente de datos semántica guardada con éxito!");
      setTimeout(() => {
        setIsEditing(false);
        setSelectedDs(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta Fuente de Datos semántica? Los mapeos asociados fallarán.")) {
      return;
    }

    try {
      const res = await fetch(`/api/datasources/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
        setIsEditing(false);
        setSelectedDs(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert("Error al eliminar la fuente de datos.");
    }
  };

  const getTypeColor = (type: SemanticField["type"]) => {
    switch (type) {
      case "CURRENCY": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "PERCENTAGE": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
      case "DATE": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "IDENTIFIER": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-text-muted bg-bg-inner border-border-main";
    }
  };

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'POSTGRESQL':
      case 'MYSQL':
      case 'ORACLE':
        return Database;
      case 'SQLSERVER':
        return Server;
      case 'INFORMIX':
      case 'REDSHIFT':
        return HardDrive;
      case 'EXCEL':
        return FileSpreadsheet;
      case 'CSV':
      case 'TXT':
        return FileText;
      case 'JSON':
        return Braces;
      case 'XML':
        return FileCode;
      case 'GOOGLE_SHEETS':
        return Globe;
      case 'EXCEL_URL':
        return LinkIcon;
      case 'BIGQUERY':
      case 'SNOWFLAKE':
        return Cloud;
      case 'SUPABASE':
      case 'FIREBASE':
      case 'APPWRITE':
      case 'POCKETBASE':
        return Zap;
      default:
        return Database;
    }
  };

  // Filter connections in Step 1
  const filteredConnections = connections.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.engine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-text-main min-h-screen">
      {/* Page Header */}
      {!isEditing && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <span>Looker Data Sources</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold">
                SEMANTIC LAYER
              </span>
            </h1>
            <p className="text-text-muted text-sm mt-1">
              Abstraiga sus bases de datos en modelos semánticos con campos calculados, tipos lógicos y agregaciones avanzadas.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Crear Fuente de Datos
          </button>
        </div>
      )}

      {isEditing ? (
        /* WIZARD CONTAINER */
        <div className="space-y-6">
          {/* Wizard Header with Title and Stepper */}
          <div className="bg-card-main border border-border-main rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Wizard de Fuentes de Datos Looker
                </span>
                <h2 className="text-xl font-bold text-text-main mt-1">
                  {wizardStep === 1 && "Conectar a un Origen de Datos (Looker Connectors)"}
                  {wizardStep === 2 && "Configurar Parámetros del Modelo de Extracción"}
                  {wizardStep === 3 && "Editor de Campos Semánticos"}
                </h2>
              </div>

              {/* Stepper Steps */}
              <div className="flex items-center gap-2 bg-bg-inner p-2.5 rounded-xl border border-border-main font-mono text-xs font-semibold">
                {[
                  { label: "Conectores", step: 1 },
                  { label: "Extracción", step: 2 },
                  { label: "Campos Looker", step: 3 }
                ].map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        wizardStep === s.step 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                          : wizardStep > s.step 
                            ? "text-emerald-500" 
                            : "text-text-muted"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${
                        wizardStep >= s.step ? "border-current" : "border-border-main"
                      }`}>
                        {wizardStep > s.step ? "✓" : s.step}
                      </span>
                      <span>{s.label}</span>
                    </div>
                    {idx < 2 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT CONNECTION */}
          {wizardStep === 1 && (
            <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-main">
                <div>
                  <h3 className="text-base font-bold text-text-main">1. Seleccione una Conexión</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Elija un conector registrado para extraer y catalogar sus dimensiones y métricas.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar conector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bg-inner border border-border-main rounded-xl text-xs text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>

              {filteredConnections.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border-main rounded-xl">
                  <Database className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-text-main">No se encontraron conexiones</h4>
                  <p className="text-xs text-text-muted mt-1">
                    Configure una conexión en la pestaña de Conexiones BD primero.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredConnections.map((conn) => {
                    const IconComp = getEngineIcon(conn.engine);
                    const isSelected = selectedConnection?.id === conn.id;
                    return (
                      <div
                        key={conn.id}
                        onClick={() => {
                          setSelectedConnection(conn);
                          setDsConnectionId(String(conn.id));
                          setErrorMsg(null);
                        }}
                        className={`cursor-pointer border rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 relative group overflow-hidden ${
                          isSelected 
                            ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                            : "bg-bg-inner/40 border-border-main hover:border-indigo-500/50 hover:bg-bg-inner/80"
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          isSelected ? "bg-indigo-500/20 text-indigo-500 dark:text-indigo-400" : "bg-bg-inner text-text-muted group-hover:text-text-main"
                        }`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-text-main group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {conn.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            <span className="bg-bg-inner border border-border-main text-text-muted px-1.5 py-0.5 rounded uppercase font-semibold">
                              {conn.engine}
                            </span>
                            {conn.isMock && (
                              <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-semibold">
                                Mock
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-muted font-mono truncate max-w-[200px] mt-1" title={conn.database || ""}>
                            {conn.database ? `Ref: ${conn.database}` : conn.host ? `${conn.host}:${conn.port}` : "Sin ruta"}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-4 right-4 text-indigo-500 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5 fill-indigo-500/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-xs text-center font-mono leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Regresar a la Lista
                </button>
                <button
                  type="button"
                  onClick={handleNextStep1}
                  disabled={!selectedConnection}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIGURE EXTRACTION */}
          {wizardStep === 2 && (
            <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl animate-fade-in">
              <div className="pb-4 border-b border-border-main flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-text-main">2. Configurar la Fuente de Datos</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Nombre su modelo semántico y defina qué tabla o consulta se extraerá de la base.
                  </p>
                </div>
                {/* Active Connector Summary */}
                {selectedConnection && (
                  <div className="flex items-center gap-2 bg-bg-inner border border-border-main px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <span className="text-text-muted font-normal">Conector:</span>
                    <span className="text-text-main">{selectedConnection.name}</span>
                    <span className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 px-1 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                      {selectedConnection.engine}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setWizardStep(1)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline ml-2 font-mono text-[10px]"
                    >
                      [Cambiar]
                    </button>
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                      Nombre de la Fuente de Datos
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Finanzas CCF Semántico"
                      value={dsName}
                      onChange={(e) => setDsName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                      Descripción del Modelo
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Explique el propósito de esta fuente semántica a otros analistas..."
                      value={dsDescription}
                      onChange={(e) => setDsDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4 bg-bg-inner/40 border border-border-main p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider font-mono">
                      Estrategia de Extracción Base
                    </label>
                    <span className="text-[10px] text-text-muted">
                      Determine la consulta raíz sobre el conector
                    </span>
                  </div>

                  <div className="flex gap-2 p-1 bg-bg-inner rounded-xl border border-border-main">
                    <button
                      type="button"
                      onClick={() => setBaseConfigType("TABLE")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        baseConfigType === "TABLE" ? "bg-indigo-600 text-white shadow-md" : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      TABLA O ARCHIVO FÍSICO
                    </button>
                    <button
                      type="button"
                      onClick={() => setBaseConfigType("CUSTOM_SQL")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        baseConfigType === "CUSTOM_SQL" ? "bg-indigo-600 text-white shadow-md" : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      SQL / CONSULTA PERSONALIZADA
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider font-mono">
                      {baseConfigType === "TABLE" ? "Nombre de la Tabla / Colección" : "Consulta SQL de Extracción"}
                    </label>
                    {baseConfigType === "TABLE" ? (
                      <input
                        type="text"
                        placeholder="ej: dbo.cajas_presupuesto"
                        value={baseConfigQuery}
                        onChange={(e) => setBaseConfigQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-mono"
                      />
                    ) : (
                      <textarea
                        rows={6}
                        placeholder="SELECT nit_caja, periodo, codigo_concepto, valor_presupuesto FROM dbo.cajas_presupuesto"
                        value={baseConfigQuery}
                        onChange={(e) => setBaseConfigQuery(e.target.value)}
                        className="w-full p-3.5 bg-bg-inner border border-border-main text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-mono"
                      />
                    )}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-xs text-center font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Connecting loading simulation */}
              {isConnecting && (
                <div className="space-y-3 bg-bg-inner border border-border-main p-5 rounded-2xl animate-fade-in">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                      Conectando con el origen y analizando metadatos...
                    </span>
                    <span className="text-text-muted">{connectingProgress}%</span>
                  </div>
                  <div className="w-full bg-bg-inner h-2 rounded-full overflow-hidden border border-border-main">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${connectingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  disabled={isConnecting}
                  className="px-5 py-2.5 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleConnectSource}
                  disabled={isConnecting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  Conectar y Cargar Campos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOOKER SCHEMA EDITOR */}
          {wizardStep === 3 && (
            <div className="bg-card-main border border-border-main rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in overflow-hidden">
              {/* Looker Schema Header */}
              <div className="bg-bg-inner/80 p-6 border-b border-border-main flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      Looker Studio Workspace
                    </span>
                    {selectedConnection && (
                      <span className="text-[10px] bg-bg-inner text-text-muted border border-border-main px-2 py-0.5 rounded font-mono">
                        Conector: {selectedConnection.name} ({selectedConnection.engine})
                      </span>
                    )}
                  </div>
                  {/* Editable Title Name just like Looker Studio */}
                  <input
                    type="text"
                    value={dsName}
                    onChange={(e) => setDsName(e.target.value)}
                    placeholder="Nombre de la fuente de datos..."
                    className="bg-transparent border-b border-transparent hover:border-border-main focus:border-indigo-500 focus:outline-none text-2xl font-extrabold text-text-main w-full tracking-tight font-sans py-0.5 max-w-lg transition-colors"
                  />
                  <p className="text-text-muted text-xs mt-1">
                    Edite los nombres semánticos, configure tipos lógicos y agregue campos calculados que se evaluarán en memoria.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {!selectedDs && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Configuración
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshFields}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title="Actualizar columnas desde el archivo o base"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin text-indigo-500" : "text-text-muted"}`} />
                    Sincronizar Origen
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={submitting}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Fuente
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Looker Editor Controls and Schema Grid */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                      <span>Dimensiones y Métricas</span>
                      <span className="text-[11px] font-mono bg-bg-inner border border-border-main px-2 py-0.5 rounded text-text-muted">
                        {fields.length} campos totales
                      </span>
                    </h3>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="flex-1 sm:flex-none px-4 py-2 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-text-muted" />
                      Campo Físico
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormulaError(null);
                        setShowFormulaModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Braces className="w-4 h-4 text-white" />
                      Campo Calculado (f(x))
                    </button>
                  </div>
                </div>

                {/* Table Schema Editor */}
                <div className="overflow-x-auto border border-border-main rounded-2xl bg-bg-inner/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-main bg-bg-inner/80 text-[10px] uppercase tracking-wider text-text-muted font-mono">
                        <th className="py-4 px-5">Campo (ID Técnico)</th>
                        <th className="py-4 px-5">Nombre de Visualización</th>
                        <th className="py-4 px-5">Categoría Semántica</th>
                        <th className="py-4 px-5">Tipo Lógico</th>
                        <th className="py-4 px-5">Agregación Predeterminada</th>
                        <th className="py-4 px-5">Fórmula de Cálculo</th>
                        <th className="py-4 px-5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main text-xs">
                      {fields.map((field, idx) => (
                        <tr
                          key={field.id}
                          className={`hover:bg-bg-hover/40 transition-colors ${
                            field.isCalculated ? "bg-indigo-500/5" : ""
                          }`}
                        >
                          {/* Campo ID */}
                          <td className="py-4 px-5">
                            {field.isCalculated ? (
                              <div className="flex items-center gap-1.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded w-max">
                                <span className="text-[10px] font-sans">f(x)</span>
                                <span>{field.id}</span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={field.id}
                                onChange={(e) => handleFieldChange(idx, "id", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                placeholder="columna_id"
                                className="bg-transparent border-b border-transparent hover:border-border-main focus:border-indigo-500 focus:outline-none p-1 font-mono text-text-main w-full"
                              />
                            )}
                          </td>

                          {/* Display Name */}
                          <td className="py-4 px-5">
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                              placeholder="Nombre de columna"
                              className="bg-transparent border-b border-transparent hover:border-border-main focus:border-indigo-500 focus:outline-none p-1 font-semibold text-text-main w-full"
                            />
                          </td>

                          {/* Category (Green Dimension / Blue Measure like Looker Studio) */}
                          <td className="py-4 px-5">
                            <select
                              value={field.category}
                              onChange={(e) => handleFieldChange(idx, "category", e.target.value)}
                              disabled={field.isCalculated}
                              className={`px-3 py-1.5 rounded-lg font-bold focus:outline-none transition-all cursor-pointer ${
                                field.category === "DIMENSION"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                              }`}
                            >
                              <option value="DIMENSION" className="bg-card-main text-emerald-600 dark:text-emerald-400 font-bold">🟢 DIMENSIÓN</option>
                              <option value="MEASURE" className="bg-card-main text-blue-600 dark:text-blue-400 font-bold">🔵 MÉTRICA</option>
                            </select>
                          </td>

                          {/* Semantic Type */}
                          <td className="py-4 px-5">
                            <select
                              value={field.type}
                              onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border focus:outline-none cursor-pointer ${getTypeColor(
                                field.type
                              )}`}
                            >
                              <option value="TEXT" className="bg-card-main text-text-main">TEXTO</option>
                              <option value="NUMBER" className="bg-card-main text-text-main">NÚMERO</option>
                              <option value="CURRENCY" className="bg-card-main text-emerald-600 dark:text-emerald-400">MONEDA (COP)</option>
                              <option value="PERCENTAGE" className="bg-card-main text-purple-600 dark:text-purple-400">PORCENTAJE</option>
                              <option value="DATE" className="bg-card-main text-amber-600 dark:text-amber-400">FECHA</option>
                              <option value="IDENTIFIER" className="bg-card-main text-blue-600 dark:text-blue-400">IDENTIFICADOR</option>
                            </select>
                          </td>

                          {/* Aggregation */}
                          <td className="py-4 px-5 font-mono">
                            {field.category === "MEASURE" ? (
                              <select
                                value={field.aggregation || "SUM"}
                                onChange={(e) => handleFieldChange(idx, "aggregation", e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-border-main focus:border-indigo-500 focus:outline-none p-1 text-text-main cursor-pointer"
                              >
                                <option value="SUM" className="bg-card-main text-text-main">SUM</option>
                                <option value="AVG" className="bg-card-main text-text-main">AVG</option>
                                <option value="COUNT" className="bg-card-main text-text-main">COUNT</option>
                                <option value="MIN" className="bg-card-main text-text-main">MIN</option>
                                <option value="MAX" className="bg-card-main text-text-main">MAX</option>
                                <option value="NONE" className="bg-card-main text-text-main">NONE (FÓRMULA)</option>
                              </select>
                            ) : (
                              <span className="text-text-muted/40">—</span>
                            )}
                          </td>

                          {/* Formula / Calculated */}
                          <td className="py-4 px-5">
                            {field.isCalculated ? (
                              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 block w-max max-w-[200px] truncate" title={field.formula}>
                                {field.formula}
                              </span>
                            ) : (
                              <span className="text-text-muted italic text-[11px]">Origen físico</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(idx)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                              title="Remover campo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Tip block */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-3.5 text-xs leading-relaxed text-indigo-700 dark:text-indigo-300">
                  <AlertCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-800 dark:text-indigo-200 block mb-0.5">Tip Semántico de Looker:</span>
                    Las <span className="text-emerald-600 dark:text-emerald-400 font-bold">Dimensiones</span> se utilizan para clasificar y agrupar la información (ej. código piloto, periodo, nit). Las <span className="text-blue-600 dark:text-blue-400 font-bold">Métricas</span> son valores agregables (ej. valor_presupuesto, total) a los que se les aplica SUM, AVG o COUNT.
                  </div>
                </div>

                {/* LIVE DATA PREVIEW PANEL AT THE BOTTOM */}
                {previewRows.length > 0 && (
                  <div className="border border-border-main rounded-2xl overflow-hidden bg-bg-inner/20 animate-fade-in space-y-3 p-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border-main">
                      <Table2 className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-text-main font-mono uppercase tracking-wider">
                        Vista Previa de los Datos (Primeras 5 Filas)
                      </h4>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border-main">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead>
                          <tr className="bg-bg-inner border-b border-border-main text-text-muted">
                            {Object.keys(previewRows[0] || {}).map((col) => (
                              <th key={col} className="p-3 text-[10px] uppercase font-bold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main text-text-main">
                          {previewRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-bg-hover/30">
                              {Object.values(row).map((val: any, cIdx) => (
                                <td key={cIdx} className="p-3 truncate max-w-[180px]" title={String(val)}>
                                  {val === null || val === undefined ? (
                                    <span className="text-text-muted/40 italic">null</span>
                                  ) : typeof val === "object" ? (
                                    JSON.stringify(val)
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="mx-6 mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-xs text-center font-mono">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mx-6 mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs text-center font-semibold animate-fade-in">
                  ✅ {successMsg}
                </div>
              )}

              {/* Step 3 footer */}
              <div className="p-6 bg-bg-inner/40 border-t border-border-main flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Regresar a la Lista
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                >
                  <Save className="w-4 h-4" />
                  Guardar y Activar Fuente
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN DATASOURCES LIST VIEW */
        loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-bg-inner/20 rounded-3xl border border-border-main">
            <RefreshCw className="animate-spin h-10 w-10 text-indigo-500" />
            <span className="text-text-muted text-sm font-mono">Consultando esquemas semánticos de Looker...</span>
          </div>
        ) : dataSources.length === 0 ? (
          <div className="bg-card-main border border-border-main rounded-2xl p-16 text-center text-text-muted backdrop-blur-xl animate-fade-in">
            <div className="w-16 h-16 bg-bg-inner border border-border-main rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-main">No hay Fuentes de Datos Looker</h3>
            <p className="text-xs text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
              Cree un modelo de fuente de datos semántica para encapsular tablas de base de datos relacionales y crear campos dinámicos para sus reportes.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crear Nueva Fuente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {dataSources.map((ds) => {
              let fieldCount = 0;
              let calcCount = 0;
              try {
                const fs = JSON.parse(ds.fieldsJson || "[]");
                fieldCount = fs.length;
                calcCount = fs.filter((f: any) => f.isCalculated).length;
              } catch {}

              const IconComp = ds.connection ? getEngineIcon(ds.connection.engine) : Database;

              return (
                <div
                  key={ds.id}
                  className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/30 hover:bg-bg-inner/40 transition-all duration-300 group overflow-hidden relative backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-bg-inner border border-border-main rounded-xl text-text-muted group-hover:text-indigo-500 transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-text-main group-hover:text-indigo-500 transition-colors line-clamp-1">
                            {ds.name}
                          </h3>
                          <span className="text-[9px] text-text-muted font-mono block mt-0.5">
                            Modificado el {new Date(ds.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase shrink-0">
                        Looker DS
                      </span>
                    </div>

                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed min-h-[32px]">
                      {ds.description || "Sin descripción detallada."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-main text-[10px] font-mono">
                      <div className="p-2 bg-bg-inner border border-border-main rounded-lg flex flex-col">
                        <span className="text-text-muted text-[9px]">CAMPOS SEMÁNTICOS</span>
                        <span className="text-text-main font-bold mt-1 text-sm">{fieldCount}</span>
                      </div>
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex flex-col">
                        <span className="text-indigo-600 dark:text-indigo-400 text-[9px]">CAMPOS CALCULADOS</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-sm">{calcCount} f(x)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-main flex gap-2">
                    <button
                      onClick={() => handleSelectDs(ds)}
                      className="flex-1 py-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-600/20 hover:border-transparent"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      EDITAR SCHEMA
                    </button>
                    <button
                      onClick={() => handleDelete(ds.id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Eliminar Fuente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Calculated Field creator Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-card-main border border-border-main rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="border-b border-border-main pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-text-main">Nuevo Campo Calculado Semántico</h3>
                <p className="text-xs text-text-muted mt-1">Configure la fórmula aritmética virtual en memoria</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddCalculatedField} className="space-y-4">
              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                  Nombre descriptivo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Diferencia de Caja"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    ID Técnico (Variable)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: diferencia_caja"
                    value={newFieldId}
                    onChange={(e) => setNewFieldId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                    Tipo Semántico
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs cursor-pointer"
                  >
                    <option value="NUMBER" className="bg-card-main text-text-main">NÚMERO</option>
                    <option value="CURRENCY" className="bg-card-main text-text-main">MONEDA (COP)</option>
                    <option value="PERCENTAGE" className="bg-card-main text-text-main">PORCENTAJE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono flex justify-between items-center">
                  <span>Expresión / Fórmula</span>
                  <span className="text-[10px] text-text-muted font-normal">Soporta: +, -, *, /, ( )</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: valor_presupuesto - valor_ejecutado"
                  value={newFieldFormula}
                  onChange={(e) => setNewFieldFormula(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-mono"
                />
              </div>

              {/* List of active variables to help user copy */}
              <div className="space-y-2 p-3 bg-bg-inner rounded-xl border border-border-main">
                <span className="block text-[10px] text-text-muted uppercase tracking-wider font-mono">Variables Disponibles (Clic para añadir):</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {fields.filter(f => !f.isCalculated).map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setNewFieldFormula(newFieldFormula + (newFieldFormula ? " " : "") + f.id)}
                      className="px-2 py-1 rounded text-[10px] font-mono bg-bg-hover hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-border-main text-text-main font-semibold cursor-pointer transition-all"
                    >
                      {f.id}
                    </button>
                  ))}
                </div>
              </div>

              {formulaError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-xs text-center font-mono leading-relaxed">
                  ⚠️ {formulaError}
                </div>
              )}

              <div className="border-t border-border-main pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="px-4 py-2 bg-bg-inner hover:bg-bg-hover border border-border-main text-text-main text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Agregar a la Fuente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
