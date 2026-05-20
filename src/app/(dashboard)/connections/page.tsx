"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, FileSpreadsheet, Globe, ChevronRight, CheckCircle2, 
  UploadCloud, Link as LinkIcon, Save, ArrowRight, Server, Cloud, Boxes, HardDrive, Flame, Box, Zap, FileText, FileCode, Braces
} from 'lucide-react';

interface Connection {
  id: number;
  name: string;
  engine: string;
  host: string | null;
  port: number | null;
  username: string | null;
  database: string | null;
  isMock: boolean;
}

interface User {
  id: number;
  role: string;
}

const engines = [
  { id: 'POSTGRESQL', name: 'PostgreSQL', icon: Database, desc: 'Base de datos relacional' },
  { id: 'SQLSERVER', name: 'SQL Server', icon: Server, desc: 'Microsoft SQL Server' },
  { id: 'ORACLE', name: 'Oracle DB', icon: Database, desc: 'Oracle Database' },
  { id: 'INFORMIX', name: 'Informix', icon: HardDrive, desc: 'IBM Informix' },
  { id: 'MYSQL', name: 'MySQL', icon: Database, desc: 'Base de datos relacional' },
  { id: 'EXCEL', name: 'Excel (Local)', icon: FileSpreadsheet, desc: 'Subir archivo (.xlsx)' },
  { id: 'EXCEL_URL', name: 'Excel (Nube)', icon: LinkIcon, desc: 'Enlace a archivo' },
  { id: 'GOOGLE_SHEETS', name: 'Google Sheets', icon: Globe, desc: 'Hoja de cálculo' },
  { id: 'BIGQUERY', name: 'Google BigQuery', icon: Cloud, desc: 'Data Warehouse (GCP)' },
  { id: 'SNOWFLAKE', name: 'Snowflake', icon: Boxes, desc: 'Data Cloud Platform' },
  { id: 'REDSHIFT', name: 'Amazon Redshift', icon: Cloud, desc: 'Data Warehouse (AWS)' },
  { id: 'SUPABASE', name: 'Supabase', icon: Zap, desc: 'Open Source BaaS' },
  { id: 'FIREBASE', name: 'Firebase', icon: Flame, desc: 'BaaS by Google' },
  { id: 'APPWRITE', name: 'Appwrite', icon: Box, desc: 'Backend Server for Web' },
  { id: 'POCKETBASE', name: 'PocketBase', icon: Zap, desc: 'Open Source BaaS' },
  { id: 'CSV', name: 'Archivo CSV', icon: FileText, desc: 'Valores separados por comas' },
  { id: 'TXT', name: 'Archivo TXT', icon: FileText, desc: 'Archivo de texto plano' },
  { id: 'JSON', name: 'Archivo JSON', icon: Braces, desc: 'Datos estructurados JSON' },
  { id: 'XML', name: 'Archivo XML', icon: FileCode, desc: 'Formato de etiquetas' },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string } | null>(null);

  // Form states for new connection
  const [showForm, setShowForm] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [name, setName] = useState("");
  const [engine, setEngine] = useState("POSTGRESQL");
  
  // Paso 2 States
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [username, setUsername] = useState("postgres");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [isMock, setIsMock] = useState(true);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formTesting, setFormTesting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    // 1. Obtener usuario actual para validar rol
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Error fetching user session:", err));

    // 2. Obtener lista de conexiones existentes
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (conn: Connection) => {
    setTestingId(conn.id);
    setTestResult(null);

    try {
      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: conn.engine,
          host: conn.host,
          port: conn.port,
          username: conn.username,
          database: conn.database,
          isMock: conn.isMock,
          password: conn.isMock ? "" : "DECRYPT_NOT_SUPPORTED", // En mock no importa, en real mandaría el pass real configurado
        }),
      });

      const data = await res.json();
      setTestResult({
        id: conn.id,
        success: res.ok && data.success,
        message: data.success ? data.message : data.error || "Fallo en la conexión.",
      });
    } catch (err: any) {
      setTestResult({
        id: conn.id,
        success: false,
        message: "Error de red al intentar conectar.",
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleTestNewForm = async () => {
    setFormTesting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine)) {
        if (!file) {
          throw new Error("Debe subir un archivo para probar");
        }
        // Simular test de archivo subiendo el archivo
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.message || "Error al subir el archivo.");
        }
        setFormSuccess(`🧪 Archivo "${file.name}" cargado y verificado correctamente.`);
        return;
      }

      if (engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') {
        if (!sheetUrl) {
          throw new Error("Debe ingresar la URL para probar");
        }
        if (!sheetUrl.startsWith("http://") && !sheetUrl.startsWith("https://")) {
          throw new Error("La URL debe comenzar con http:// o https://");
        }
        setFormSuccess(`🧪 Enlace verificado y listo.`);
        return;
      }

      const res = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine,
          host,
          port,
          username,
          password,
          database,
          isMock,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess(data.message);
      } else {
        setFormError(data.error || "Fallo en la prueba de conexión.");
      }
    } catch (err: any) {
      setFormError(err.message || "Error de red intentando conectar.");
    } finally {
      setFormTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    let currentDatabase = database;

    try {
      if (['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine)) {
        if (!file) {
          throw new Error("Debe subir un archivo");
        }
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.message || "Error al subir el archivo.");
        }
        currentDatabase = uploadData.filePath;
      } else if (engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') {
        if (!sheetUrl) {
          throw new Error("Debe ingresar la URL");
        }
        currentDatabase = sheetUrl;
      }

      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `Conexión ${engine}`,
          engine,
          host: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? host : null,
          port: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? (port ? parseInt(port, 10) : null) : null,
          username: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? username : null,
          password: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? password : null,
          database: currentDatabase,
          isMock: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? isMock : false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la conexión.");
      }

      setFormSuccess("Conexión guardada con éxito.");
      setShowForm(false);
      resetForm();
      fetchConnections();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta conexión? Se perderá permanentemente.")) {
      return;
    }

    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error}`);
        return;
      }

      fetchConnections();
    } catch (err) {
      alert("Error al intentar eliminar la conexión.");
    }
  };

  const resetForm = () => {
    setName("");
    setEngine("POSTGRESQL");
    setHost("localhost");
    setPort("5432");
    setUsername("postgres");
    setPassword("");
    setDatabase("");
    setIsMock(true);
    setWizardStep(1);
    setFile(null);
    setSheetUrl("");
    setFormError(null);
    setFormSuccess(null);
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Conexiones a Bases de Datos
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Administre los orígenes de datos relacionales desde donde se extraen los reportes regulatorios.
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
            {showForm ? "Cancelar Registro" : "Registrar Conexión"}
          </button>
        )}
      </div>

      {/* Formulario de registro (Glassmorphism Modal) */}
      {showForm && (
        <div className="bg-card-main border border-border-main rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-border-main pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-text-main">
                {wizardStep === 1 ? "Seleccione el Tipo de Conexión" : `Nueva Conexión: ${engines.find(e => e.id === engine)?.name}`}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {wizardStep === 1 ? "Seleccione el motor de base de datos o el tipo de archivo para integrar" : "Configure los parámetros de red y credenciales de acceso"}
              </p>
            </div>
            {wizardStep === 2 && (
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer bg-bg-inner px-3 py-1.5 rounded-lg border border-border-main"
              >
                ← Cambiar Origen
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-sm text-center">
              ⚠️ {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-300 text-sm text-center">
              ✅ {formSuccess}
            </div>
          )}

          {wizardStep === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {engines.map((eng) => {
                  const Icon = eng.icon;
                  const isSelected = engine === eng.id;
                  return (
                    <div
                      key={eng.id}
                      onClick={() => setEngine(eng.id)}
                      className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center text-center transition-all
                        ${isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'border-border-main bg-bg-inner hover:border-indigo-500/50 hover:bg-bg-hover'}`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-indigo-400' : 'text-text-muted'}`} />
                      <h4 className="text-text-main font-semibold text-sm">{eng.name}</h4>
                      <p className="text-[10px] text-text-muted mt-1 leading-snug">{eng.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t border-border-main">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                    Nombre descriptivo de la Conexión
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Ej: Conexión ${engines.find(e => e.id === engine)?.name}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine) && (
                  <div className="md:col-span-2 border-2 border-dashed border-border-main rounded-xl p-8 flex flex-col items-center justify-center bg-bg-inner">
                    <UploadCloud className="w-12 h-12 text-indigo-400 mb-2" />
                    <p className="text-sm text-text-main mb-4 font-medium">
                      {file ? `Archivo seleccionado: ${file.name}` : "Arrastre su archivo o haga clic para seleccionar"}
                    </p>
                    <input 
                      type="file" 
                      required={!file}
                      accept={engine==='EXCEL'?'.xlsx': engine==='CSV'?'.csv': engine==='TXT'?'.txt': engine==='JSON'?'.json': '.xml'} 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                      className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer" 
                    />
                  </div>
                )}

                {(engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') && (
                  <div className="md:col-span-2 bg-bg-inner border border-border-main rounded-xl p-4">
                    <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                      URL Pública del Documento
                    </label>
                    <div className="flex gap-2">
                      <div className="bg-card-main px-3 py-2 rounded-lg border border-border-main flex items-center">
                        <LinkIcon size={16} className="text-text-muted" />
                      </div>
                      <input 
                        value={sheetUrl} 
                        onChange={e=>setSheetUrl(e.target.value)}
                        required
                        className="w-full bg-card-main border border-border-main rounded-lg px-3 py-2 text-text-main text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                        placeholder="https://..." 
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-2">Asegúrese de que el documento tenga permisos de lectura públicos.</p>
                  </div>
                )}

                {['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) && (
                  <>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 p-3 bg-bg-inner border border-border-main rounded-xl cursor-pointer hover:bg-bg-hover transition-colors">
                        <input
                          type="checkbox"
                          checked={isMock}
                          onChange={(e) => setIsMock(e.target.checked)}
                          className="w-5 h-5 rounded border-border-main text-indigo-600 bg-bg-main focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-semibold text-text-main block">¿Activar Simulación de Datos (Mock)?</span>
                          <span className="text-xs text-text-muted">Si se activa, el extractor simulará respuestas con errores de validación deliberados para testing visual.</span>
                        </div>
                      </label>
                    </div>

                    {!isMock && (
                      <>
                        <div>
                          <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                            Dirección IP / Hostname
                          </label>
                          <input
                            type="text"
                            required={!isMock}
                            placeholder="127.0.0.1 o db.empresa.com"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                            Puerto de conexión
                          </label>
                          <input
                            type="number"
                            required={!isMock}
                            placeholder="5432"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                            Usuario base de datos
                          </label>
                          <input
                            type="text"
                            required={!isMock}
                            placeholder="postgres"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                            Contraseña
                          </label>
                          <input
                            type="password"
                            required={!isMock}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                            Nombre de la Base de Datos
                          </label>
                          <input
                            type="text"
                            required={!isMock}
                            placeholder="empresa_db"
                            value={database}
                            onChange={(e) => setDatabase(e.target.value)}
                            className="w-full px-4 py-3 bg-bg-inner border border-border-main rounded-xl text-text-main placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-border-main pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleTestNewForm}
                  disabled={formTesting || formSubmitting}
                  className="px-5 py-3 bg-card-main hover:bg-bg-hover text-text-main border border-border-main rounded-xl font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  {formTesting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Probando...
                    </>
                  ) : (
                    "Probar Parámetros"
                  )}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || formTesting}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {formSubmitting ? "Registrando..." : "Guardar Conexión"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Listado de Conexiones */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-text-muted text-sm font-mono">Consultando orígenes de datos en el servidor...</span>
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-card-main border border-border-main rounded-2xl p-12 text-center text-text-muted">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-bold text-text-main">No hay orígenes de datos registrados</h3>
          <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">Registre una base de datos PostgreSQL externa o active el modo de simulación para empezar a extraer datos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-card-main border border-border-main rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/20 hover:bg-bg-hover transition-all duration-300 relative overflow-hidden group"
            >
              {/* Bloque superior */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-text-main leading-snug group-hover:text-indigo-400 transition-colors">
                      {conn.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-semibold font-mono text-[9px] bg-bg-inner text-text-muted mt-2 uppercase border border-border-main">
                      {conn.engine}
                    </span>
                  </div>
                  {conn.isMock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      SIMULACIÓN
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CONEXIÓN REAL
                    </span>
                  )}
                </div>

                {/* Parámetros */}
                <div className="pt-2 space-y-1.5 border-t border-border-main text-xs text-text-muted font-mono">
                  <div className="flex justify-between">
                    <span>Servidor/Host:</span>
                    <span className="text-text-main">{conn.host || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Puerto:</span>
                    <span className="text-text-main">{conn.port || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Datos:</span>
                    <span className="text-text-main truncate max-w-[150px]">{conn.database || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usuario:</span>
                    <span className="text-text-main">{conn.username || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-6 pt-4 border-t border-border-main flex gap-2">
                <button
                  onClick={() => handleTestConnection(conn)}
                  disabled={testingId === conn.id}
                  className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs font-semibold font-mono tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {testingId === conn.id ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      PROBANDO
                    </>
                  ) : (
                    "PROBAR CONEXIÓN"
                  )}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                    title="Eliminar Conexión"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Resultado del Test individual */}
              {testResult && testResult.id === conn.id && (
                <div
                  className={`absolute inset-0 bg-card-main backdrop-blur-md p-6 flex flex-col justify-center items-center text-center z-20 gap-4 animate-fade-in`}
                >
                  {testResult.success ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold font-mono">CONEXIÓN OK</span>
                      <p className="text-xs text-text-muted px-2">{testResult.message}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-rose-500 dark:text-rose-400 text-sm font-bold font-mono">CONEXIÓN FALLIDA</span>
                      <p className="text-xs text-rose-600 dark:text-rose-300 font-mono px-2 overflow-y-auto max-h-[100px]">{testResult.message}</p>
                    </>
                  )}
                  <button
                    onClick={() => setTestResult(null)}
                    className="mt-2 text-xs font-bold text-text-muted hover:text-text-main underline font-mono cursor-pointer"
                  >
                    REGRESAR
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
