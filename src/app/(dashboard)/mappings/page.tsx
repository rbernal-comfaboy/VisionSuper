"use client";

import React, { useState, useEffect } from "react";

interface Connection {
  id: number;
  name: string;
  isMock: boolean;
}

interface Mapping {
  id: number;
  name: string;
  reportCode: string;
  sqlQuery: string;
  fieldMappings: string; // JSON string
  connection: Connection | null;
  dataSource?: { name: string } | null;
}

interface User {
  id: number;
  role: string;
}

// XSD Fields metadata for visual mapping
const REPORT_FIELDS: Record<string, { tag: string; description: string }[]> = {
  "2-001A": [
    { tag: "TIP_IDENTIFICACION", description: "Código de Tipo ID de Empresa (ej. 1=NIT, 2=Cédula)" },
    { tag: "NUM_IDENTIFICACION", description: "Número de Identificación de Empresa (máx 16, sin puntos)" },
    { tag: "NOM_EMPRESA", description: "Razón Social o Nombre Completo de la Empresa" },
    { tag: "COD_MUNICIPIO_DANE", description: "Código de Municipio DANE de ubicación (5 caracteres)" },
    { tag: "DIR_CORRESPONDECIA", description: "Dirección postal o física de correspondencia" },
    { tag: "EST_VINCULACION", description: "Estado de Vinculación (1=Activo, 2=Inactivo)" },
    { tag: "TIP_APORTANTE", description: "Código Tipo de Aportante (1=Principal, 2=Secundario, etc.)" },
    { tag: "TIP_SECTOR", description: "Sector de la Empresa (1=Privado, 2=Público)" },
    { tag: "ACT_ECONOMICA", description: "Actividad Económica código CIIU (máx 4 caracteres)" },
    { tag: "SIT_EMPRESA_LEY_1429", description: "Ley 1429 fomento al empleo (1 dígito)" },
    { tag: "PRO_PAGO_LEY_1429", description: "Proporción de pago Ley 1429 (1 dígito)" },
    { tag: "SIT_EMPRESA_LEY_590", description: "Ley 590 fomento microempresa (1 dígito)" },
    { tag: "PRO_PAGO_LEY_590", description: "Proporción de pago Ley 590 (1 dígito)" },
    { tag: "APO_TOTAL_MENSUAL", description: "Aporte total del mes en pesos (positivo entero)" },
    { tag: "INT_PAGADOS_MORA", description: "Intereses pagados por mora en aportes (en pesos)" },
    { tag: "VAL_REINTEGROS", description: "Valor de reintegros efectuados (en pesos)" },
  ],
  "2-002A": [
    { tag: "nit_caja", description: "NIT de la Caja de Compensación reportante" },
    { tag: "periodo", description: "Periodo reportado (AAAAMM, ej. 202505)" },
    { tag: "codigo_concepto", description: "Código del Concepto Contable / Presupuestal" },
    { tag: "descripcion", description: "Descripción detallada del Concepto" },
    { tag: "valor_presupuesto", description: "Valor Presupuestado en pesos (no negativo)" },
    { tag: "valor_ejecutado", description: "Valor Ejecutado real en pesos (no negativo)" },
  ],
};

// Looker-style visual DB schema tables explorer metadata
const MOCK_DB_SCHEMA = [
  {
    table: "dbo.core_empresas",
    description: "Información demográfica e identificación de aportantes",
    columns: [
      { name: "tipo_doc", type: "integer" },
      { name: "numero_doc", type: "varchar(16)" },
      { name: "razon_social", type: "varchar(100)" },
      { name: "dane_municipio", type: "varchar(5)" },
      { name: "direccion", type: "varchar(200)" },
      { name: "estado", type: "integer" },
      { name: "tipo_aportante", type: "integer" },
      { name: "sector", type: "integer" },
      { name: "codigo_actividad", type: "varchar(4)" },
      { name: "ley_1429", type: "integer" },
      { name: "pago_1429", type: "integer" },
      { name: "ley_590", type: "integer" },
      { name: "pago_590", type: "integer" },
      { name: "intereses_mora", type: "integer" },
      { name: "reintegros", type: "integer" }
    ]
  },
  {
    table: "dbo.ledger_aportes",
    description: "Historial de aportes financieros mensuales",
    columns: [
      { name: "nit_empresa", type: "varchar(16)" },
      { name: "total_aportado", type: "numeric(15,2)" }
    ]
  },
  {
    table: "dbo.conceptos_presupuesto",
    description: "Presupuestos y ejecuciones financieras por periodo",
    columns: [
      { name: "nit_caja", type: "varchar(16)" },
      { name: "periodo", type: "varchar(6)" },
      { name: "codigo_concepto", type: "varchar(10)" },
      { name: "descripcion", type: "varchar(200)" },
      { name: "valor_presupuesto", type: "numeric(15,2)" },
      { name: "valor_ejecutado", type: "numeric(15,2)" }
    ]
  }
];

export default function MappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [reportCode, setReportCode] = useState("2-001A");
  const [connectionId, setConnectionId] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});

  // Federated Multi-Source state
  const [isFederated, setIsFederated] = useState(false);
  const [federatedPrimaryConn, setFederatedPrimaryConn] = useState("");
  const [federatedPrimaryQuery, setFederatedPrimaryQuery] = useState("");
  const [federatedSecondaryConn, setFederatedSecondaryConn] = useState("");
  const [federatedSecondaryQuery, setFederatedSecondaryQuery] = useState("");
  const [joinKeyLeft, setJoinKeyLeft] = useState("core.numero_doc");
  const [joinKeyRight, setJoinKeyRight] = useState("aportes.nit_empresa");

  // Schema Explorer active helper
  const [expandedTable, setExpandedTable] = useState<string | null>("dbo.core_empresas");
  const [activeXsdFieldSelection, setActiveXsdFieldSelection] = useState<string | null>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    // 1. Obtener sesión
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Error fetching session:", err));

    // 2. Cargar mapeos y conexiones
    fetchData();
  }, []);

  // Recargar mapeos cuando cambie el ReportCode para pre-inicializar las claves
  useEffect(() => {
    const fields = REPORT_FIELDS[reportCode] || [];
    const initialMappings: Record<string, string> = {};
    fields.forEach((f) => {
      initialMappings[f.tag] = "";
    });
    setFieldMappings(initialMappings);
    setActiveXsdFieldSelection(fields[0]?.tag || null);
  }, [reportCode]);

  // Si cambia isFederated, auto-configurar sub-consultas federadas simuladas de ejemplo
  useEffect(() => {
    if (isFederated && connections.length > 0) {
      setFederatedPrimaryConn(String(connections[0].id));
      setFederatedSecondaryConn(String(connections[0].id));
      
      setFederatedPrimaryQuery(
        `SELECT \n  tipo_doc, \n  numero_doc, \n  razon_social, \n  dane_municipio, \n  direccion, \n  estado, \n  tipo_aportante, \n  sector, \n  codigo_actividad, \n  ley_1429, \n  pago_1429, \n  ley_590, \n  pago_590, \n  intereses_mora, \n  reintegros \nFROM dbo.core_empresas \nWHERE periodo = '2025-05';`
      );
      setFederatedSecondaryQuery(
        `SELECT \n  nit_empresa, \n  total_aportado \nFROM dbo.ledger_aportes;`
      );
      
      // Auto-mapear los campos federados
      const fields = REPORT_FIELDS["2-001A"] || [];
      const updatedMap: Record<string, string> = {};
      fields.forEach((f) => {
        if (f.tag === "APO_TOTAL_MENSUAL") {
          updatedMap[f.tag] = "total_aportado";
        } else if (f.tag === "TIP_IDENTIFICACION") {
          updatedMap[f.tag] = "tipo_doc";
        } else if (f.tag === "NUM_IDENTIFICACION") {
          updatedMap[f.tag] = "numero_doc";
        } else if (f.tag === "NOM_EMPRESA") {
          updatedMap[f.tag] = "razon_social";
        } else if (f.tag === "COD_MUNICIPIO_DANE") {
          updatedMap[f.tag] = "dane_municipio";
        } else if (f.tag === "DIR_CORRESPONDECIA") {
          updatedMap[f.tag] = "direccion";
        } else if (f.tag === "EST_VINCULACION") {
          updatedMap[f.tag] = "estado";
        } else if (f.tag === "TIP_APORTANTE") {
          updatedMap[f.tag] = "tipo_aportante";
        } else if (f.tag === "TIP_SECTOR") {
          updatedMap[f.tag] = "sector";
        } else if (f.tag === "ACT_ECONOMICA") {
          updatedMap[f.tag] = "codigo_actividad";
        } else if (f.tag === "SIT_EMPRESA_LEY_1429") {
          updatedMap[f.tag] = "ley_1429";
        } else if (f.tag === "PRO_PAGO_LEY_1429") {
          updatedMap[f.tag] = "pago_1429";
        } else if (f.tag === "SIT_EMPRESA_LEY_590") {
          updatedMap[f.tag] = "ley_590";
        } else if (f.tag === "PRO_PAGO_LEY_590") {
          updatedMap[f.tag] = "pago_590";
        } else if (f.tag === "INT_PAGADOS_MORA") {
          updatedMap[f.tag] = "intereses_mora";
        } else if (f.tag === "VAL_REINTEGROS") {
          updatedMap[f.tag] = "reintegros";
        }
      });
      setFieldMappings(updatedMap);
    }
  }, [isFederated, connections]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMappings, resConnections] = await Promise.all([
        fetch("/api/mappings"),
        fetch("/api/connections"),
      ]);

      if (resMappings.ok) {
        const data = await resMappings.json();
        setMappings(data);
      }

      if (resConnections.ok) {
        const data = await resConnections.json();
        setConnections(data);
        if (data.length > 0) {
          setConnectionId(String(data[0].id));
        }
      }
    } catch (err) {
      console.error("Error loading mapping page data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = () => {
    // Plantilla estándar por defecto
    const templates: Record<string, Record<string, string>> = {
      "2-001A": {
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
      },
      "2-002A": {
        nit_caja: "nit_caja",
        periodo: "periodo",
        codigo_concepto: "codigo_concepto",
        descripcion: "descripcion",
        valor_presupuesto: "valor_presupuesto",
        valor_ejecutado: "valor_ejecutado",
      }
    };
    
    const template = templates[reportCode];

    if (template) {
      setFieldMappings({ ...template });
      
      const columns = Object.values(template).join(", ");
      setSqlQuery(`SELECT \n  ${Object.entries(template)
        .map(([xsd, sql]) => `${sql} as ${xsd}`)
        .join(", \n  ")} \nFROM base_aportantes \nWHERE periodo = '2025-05';`);
    }
  };

  const handleColumnClick = (colName: string) => {
    if (activeXsdFieldSelection) {
      handleFieldChange(activeXsdFieldSelection, colName);
      
      // Pasar al siguiente campo XSD automáticamente para una experiencia fluida
      const fields = REPORT_FIELDS[reportCode] || [];
      const currentIndex = fields.findIndex((f) => f.tag === activeXsdFieldSelection);
      if (currentIndex !== -1 && currentIndex < fields.length - 1) {
        setActiveXsdFieldSelection(fields[currentIndex + 1].tag);
      }
    }
  };

  const handleFieldChange = (tag: string, value: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [tag]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    // Validar que todos las etiquetas XSD estén mapeadas
    const unmappedFields = Object.entries(fieldMappings).filter(([_, val]) => !val.trim());
    if (unmappedFields.length > 0) {
      setFormError(`Debe mapear todos los campos del XSD obligatoriamente. Faltan ${unmappedFields.length} campos.`);
      setFormSubmitting(false);
      return;
    }

    let finalQuery = sqlQuery;
    let finalConnectionId = connectionId;

    // Si es federado, estructurar el objeto JSON del plan
    if (isFederated) {
      const plan = {
        federated: true,
        sources: [
          {
            connectionId: parseInt(federatedPrimaryConn, 10),
            query: federatedPrimaryQuery,
            alias: "core"
          },
          {
            connectionId: parseInt(federatedSecondaryConn, 10),
            query: federatedSecondaryQuery,
            alias: "aportes"
          }
        ],
        join: {
          left: joinKeyLeft,
          right: joinKeyRight,
          type: "inner"
        }
      };
      finalQuery = JSON.stringify(plan, null, 2);
      finalConnectionId = federatedPrimaryConn;
    }

    try {
      const res = await fetch("/api/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          reportCode,
          sqlQuery: finalQuery,
          fieldMappings,
          connectionId: finalConnectionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear el mapeo de reporte.");
      }

      setFormSuccess("Mapeo de reporte guardado con éxito.");
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este mapeo? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/mappings/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error}`);
        return;
      }

      fetchData();
    } catch (err) {
      alert("Error al intentar eliminar el mapeo.");
    }
  };

  const resetForm = () => {
    setName("");
    setReportCode("2-001A");
    setSqlQuery("");
    setIsFederated(false);
    const fields = REPORT_FIELDS["2-001A"] || [];
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      initial[f.tag] = "";
    });
    setFieldMappings(initial);
    setFormError(null);
    setFormSuccess(null);
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-8 animate-fade-in text-text-main">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mapeador de Conjuntos de Datos <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full ml-2">Looker Studio</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Diseñe visualmente datasets cruzando múltiples fuentes de datos operacionales y mapéelos de forma interactiva a las reglas XSD de la Superintendencia.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              resetForm();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? "Cerrar Modelador" : "Nuevo Modelador Looker"}
          </button>
        )}
      </div>

      {/* Formulario de Mapeo Looker-Style */}
      {showForm && (
        <div className="bg-card-main border border-border-main rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-border-main pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Modelador de Conjunto de Datos Federado</h3>
              <p className="text-xs text-text-muted mt-1 font-mono">Diseño e integración de pipelines multi-base</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsFederated(!isFederated)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono border transition-all duration-200 cursor-pointer ${
                  isFederated 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-slate-500/10 text-text-muted border-border-main hover:bg-slate-500/20"
                }`}
              >
                {isFederated ? "🔗 UNIÓN MULTI-FUENTE ACTIVA" : "🔌 HABILITAR MULTI-FUENTE"}
              </button>
              {!isFederated && (
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold font-mono tracking-wider transition-colors cursor-pointer"
                >
                  ⚡ AUTO-COMPLETAR EJEMPLO
                </button>
              )}
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-300 text-sm text-center">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                  Nombre del Mapeo / Dataset Comercial
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dataset Consolidado de Aportes y Empresas de Compensación"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                  Estructura Oficial de Destino (XSD)
                </label>
                <select
                  value={reportCode}
                  onChange={(e) => setReportCode(e.target.value)}
                  className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:[&>option]:bg-slate-950 dark:[&>option]:text-white [&>option]:bg-white [&>option]:text-slate-900"
                >
                  <option value="2-001A">2-001A (Empresas y Aportantes)</option>
                  <option value="2-002A">2-002A (Ejecución Presupuestal)</option>
                </select>
              </div>
            </div>

            {/* Looker workspace grid layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 border-t border-border-main pt-6">
              
              {/* Left Column: DB Schema Explorer (Looker-Style) */}
              <div className="xl:col-span-3 space-y-4 border-r border-border-main/50 pr-4 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-border-main">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest font-mono">
                    Esquemas de BD (Looker)
                  </h4>
                  <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">En Línea</span>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Haz clic en las columnas para mapear directamente al campo XSD seleccionado a la derecha.
                </p>

                <div className="space-y-2">
                  {MOCK_DB_SCHEMA.map((dbTable) => {
                    const isExpanded = expandedTable === dbTable.table;
                    return (
                      <div key={dbTable.table} className="border border-border-main/60 rounded-xl overflow-hidden bg-bg-inner">
                        <button
                          type="button"
                          onClick={() => setExpandedTable(isExpanded ? null : dbTable.table)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors text-left"
                        >
                          <div>
                            <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">{dbTable.table}</span>
                            <span className="text-[9px] text-text-muted mt-0.5 block truncate max-w-[170px]">{dbTable.description}</span>
                          </div>
                          <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1 border-t border-border-main/40 divide-y divide-border-main/20 max-h-48 overflow-y-auto">
                            {dbTable.columns.map((col) => (
                              <button
                                type="button"
                                key={col.name}
                                onClick={() => handleColumnClick(col.name)}
                                className="w-full py-1.5 flex items-center justify-between text-left text-[11px] group font-mono text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                <span className="hover:underline">{col.name}</span>
                                <span className="text-[9px] text-slate-500 bg-bg-main px-1 py-0.5 rounded border border-border-main/20">{col.type}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Center Column: Query Designer / Federated plan designer */}
              <div className="xl:col-span-5 space-y-6">
                {!isFederated ? (
                  // Single Query Designer
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider font-mono">
                          Consulta SQL Principal (SQL Server / PostgreSQL)
                        </label>
                        <select
                          required
                          value={connectionId}
                          onChange={(e) => setConnectionId(e.target.value)}
                          className="px-2 py-1 bg-bg-inner border border-border-main rounded-lg text-xs focus:outline-none dark:[&>option]:bg-slate-950 dark:[&>option]:text-white [&>option]:bg-white [&>option]:text-slate-900"
                        >
                          {connections.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        required={!isFederated}
                        rows={10}
                        placeholder="SELECT tipo_doc, numero_doc, razon_social, ... FROM dbo.core_empresas WHERE periodo = '202505';"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-border-main rounded-2xl text-emerald-400 font-mono text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                ) : (
                  // Federated Multi-Source plan builder
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                      <span className="text-xs font-bold text-emerald-500 uppercase font-mono block">Dataset Federado Multi-Base Activo</span>
                      <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                        Este dataset combina información en tiempo real de dos orígenes de base de datos relacionales diferentes mapeándolos en memoria mediante un Join.
                      </p>
                    </div>

                    {/* Source A */}
                    <div className="space-y-2 p-4 bg-bg-inner border border-border-main rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-500 uppercase font-mono">Fuente A: Identificación (Alias: core)</span>
                        <select
                          value={federatedPrimaryConn}
                          onChange={(e) => setFederatedPrimaryConn(e.target.value)}
                          className="px-2 py-1 bg-bg-main border border-border-main rounded-lg text-xs font-mono dark:[&>option]:bg-slate-950 dark:[&>option]:text-white"
                        >
                          {connections.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        required={isFederated}
                        rows={4}
                        placeholder="SELECT columnas FROM core_empresas"
                        value={federatedPrimaryQuery}
                        onChange={(e) => setFederatedPrimaryQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-border-main rounded-xl text-emerald-400 font-mono text-[11px] focus:outline-none"
                      ></textarea>
                    </div>

                    {/* Source B */}
                    <div className="space-y-2 p-4 bg-bg-inner border border-border-main rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-500 uppercase font-mono">Fuente B: Financiero (Alias: aportes)</span>
                        <select
                          value={federatedSecondaryConn}
                          onChange={(e) => setFederatedSecondaryConn(e.target.value)}
                          className="px-2 py-1 bg-bg-main border border-border-main rounded-lg text-xs font-mono dark:[&>option]:bg-slate-950 dark:[&>option]:text-white"
                        >
                          {connections.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        required={isFederated}
                        rows={4}
                        placeholder="SELECT columnas FROM ledger_aportes"
                        value={federatedSecondaryQuery}
                        onChange={(e) => setFederatedSecondaryQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-border-main rounded-xl text-emerald-400 font-mono text-[11px] focus:outline-none"
                      ></textarea>
                    </div>

                    {/* Join Condition */}
                    <div className="p-4 bg-bg-inner border border-border-main rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono block">Cruce en Memoria (Join Condition)</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-text-muted uppercase font-mono font-semibold mb-1">Llave de Unión Izquierda</label>
                          <input
                            type="text"
                            value={joinKeyLeft}
                            onChange={(e) => setJoinKeyLeft(e.target.value)}
                            className="w-full px-3 py-1.5 bg-bg-main border border-border-main rounded-lg text-xs font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-muted uppercase font-mono font-semibold mb-1">Llave de Unión Derecha</label>
                          <input
                            type="text"
                            value={joinKeyRight}
                            onChange={(e) => setJoinKeyRight(e.target.value)}
                            className="w-full px-3 py-1.5 bg-bg-main border border-border-main rounded-lg text-xs font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Visual XSD Field Mapping List */}
              <div className="xl:col-span-4 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border-main">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest font-mono">
                    Campos Esquema XSD
                  </h4>
                  <span className="text-[10px] text-text-muted font-mono bg-bg-inner px-2 py-0.5 rounded border border-border-main">
                    {(REPORT_FIELDS[reportCode] || []).length} campos
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">
                  Haz clic sobre un campo XSD para activarlo y luego haz clic en una columna del explorador lateral para mapearlo de manera rápida.
                </p>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2 bg-bg-inner p-3 rounded-2xl border border-border-main">
                  {(REPORT_FIELDS[reportCode] || []).map((field) => {
                    const isActive = activeXsdFieldSelection === field.tag;
                    const value = fieldMappings[field.tag] || "";
                    
                    return (
                      <div
                        key={field.tag}
                        onClick={() => setActiveXsdFieldSelection(field.tag)}
                        className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-2 ${
                          isActive 
                            ? "bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white" 
                            : "bg-card-main border-border-main hover:bg-bg-hover text-text-main"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-xs font-bold font-mono tracking-tight">{field.tag}</span>
                            <span className="block text-[9px] text-text-muted mt-0.5 line-clamp-1">{field.description}</span>
                          </div>
                          {value && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono rounded">
                              ✓ Mapeado
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Arrastra o escribe aquí..."
                          value={value}
                          onChange={(e) => handleFieldChange(field.tag, e.target.value)}
                          className={`w-full px-3 py-1.5 bg-bg-inner border rounded-lg text-xs font-mono focus:outline-none ${
                            isActive ? "border-indigo-400 focus:ring-1 focus:ring-indigo-400" : "border-border-main"
                          }`}
                          onClick={(e) => e.stopPropagation()} // Evitar des-activar foco
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-border-main pt-5 flex justify-end gap-3">
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer font-mono text-sm"
              >
                {formSubmitting ? "Guardando Mapeo..." : "GUARDAR MAPEO EN BASE DE DATOS"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Mapeos Existentes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-text-muted text-sm font-mono">Cargando plantillas de extracción desde el servidor...</span>
        </div>
      ) : mappings.length === 0 ? (
        <div className="bg-card-main border border-border-main rounded-2xl p-12 text-center text-text-muted">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.553-1.96L9 2m0 18l5.447-2.724A2 2 0 0015 15.382V5.618a2 2 0 00-1.553-1.96L9 2m0 18V2" />
          </svg>
          <h3 className="text-lg font-bold text-text-main">No hay mapeos de reportes configurados</h3>
          <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">Utilice la herramienta de creación para mapear las consultas SQL a las estructuras oficiales XSD piloto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mappings.map((map) => {
            const parsedFields = JSON.parse(map.fieldMappings || "{}");
            const fieldsCount = Object.keys(parsedFields).length;

            let isMapFederated = false;
            try {
              const parsedQuery = JSON.parse(map.sqlQuery);
              if (parsedQuery.federated) {
                isMapFederated = true;
              }
            } catch (e) {}

            return (
              <div
                key={map.id}
                className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl hover:border-indigo-500/20 hover:bg-bg-hover transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {map.name}
                      </h3>
                      <div className="flex gap-2 items-center mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                          {map.reportCode}
                        </span>
                        {isMapFederated && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
                            🔗 FEDERADO LOOKER
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-text-muted bg-bg-inner px-2 py-0.5 rounded border border-border-main">
                      {map.connection?.name || map.dataSource?.name || "Sin conexión asignada"}
                    </span>
                  </div>

                  {/* SQL Preview */}
                  <div className="space-y-2 mt-4">
                    <span className="block text-[10px] text-text-muted font-semibold uppercase tracking-wider font-mono">
                      {isMapFederated ? "Estructura del Plan Federado JSON (Looker):" : "Consulta SQL de Extracción:"}
                    </span>
                    <pre className="p-3 bg-slate-950 border border-border-main rounded-xl text-[11px] text-emerald-400 font-mono max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {map.sqlQuery}
                    </pre>
                  </div>

                  {/* Fields Mapping stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs font-mono text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                      <span>{fieldsCount} Campos XSD Mapeados</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-border-main flex justify-end">
                    <button
                      onClick={() => handleDelete(map.id)}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all text-xs font-bold font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ELIMINAR MAPEO
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
