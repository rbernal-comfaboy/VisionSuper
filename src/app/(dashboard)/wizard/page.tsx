"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, FileSpreadsheet, Globe, ChevronRight, CheckCircle2, 
  UploadCloud, Link as LinkIcon, Save, ArrowRight, Server, Cloud, Boxes, HardDrive, Flame, Box, Zap, FileText, FileCode, Braces
} from 'lucide-react';

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [engine, setEngine] = useState<string>('');
  const [connectionName, setConnectionName] = useState('');
  
  // Paso 2 States
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [dbConfig, setDbConfig] = useState({ host: '', port: 5432, username: '', password: '', database: '' });
  const [databaseRef, setDatabaseRef] = useState(''); // Lo que se guardará en "database" (file path o sheet ID)
  
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Paso 3 States
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [semanticFields, setSemanticFields] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

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

  const handleNextStep1 = () => {
    if (!engine) return setErrorMsg('Por favor selecciona un tipo de origen');
    setErrorMsg('');
    setStep(2);
  };

  const handleNextStep2 = async () => {
    setErrorMsg('');
    setIsUploading(true);

    let currentRef = '';

    try {
      if (['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine)) {
        if (!file) throw new Error("Debe subir un archivo");
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        currentRef = data.filePath;
      } else if (engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') {
        if (!sheetUrl) throw new Error("Debe ingresar la URL");
        currentRef = sheetUrl;
      } else {
        currentRef = dbConfig.database || 'mock_db';
      }

      setDatabaseRef(currentRef);

      // Ahora solicitamos la vista previa
      setIsLoadingPreview(true);
      const prevRes = await fetch('/api/wizard/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, database: currentRef })
      });
      const prevData = await prevRes.json();
      
      if (!prevData.success) throw new Error(prevData.message);
      
      setPreviewData(prevData.previewData);
      setSemanticFields(prevData.semanticFields);
      setStep(3);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
      setIsLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      // 1. Crear Conexión
      const connRes = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectionName || `Conexión ${engine}`,
          engine,
          host: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? dbConfig.host : null,
          port: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? dbConfig.port : null,
          username: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? dbConfig.username : null,
          password: ['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) ? dbConfig.password : null,
          database: databaseRef,
          isMock: false
        })
      });
      const connData = await connRes.json();
      if (!connRes.ok) throw new Error(connData.error || "Error al crear la conexión base");
      
      // 2. Crear Fuente de Datos (Semantic Layer)
      const dsRes = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Fuente ${connectionName || engine}`,
          description: "Fuente generada por el Wizard",
          connectionId: connData.id,
          baseConfigJson: "{}",
          fieldsJson: JSON.stringify(semanticFields)
        })
      });
      const dsData = await dsRes.json();
      if (!dsRes.ok) throw new Error(dsData.error || "Error al crear la fuente semántica");

      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Asistente de Integración de Datos</h1>
        <p className="text-slate-400">Conecte nuevas fuentes y genere modelos semánticos en minutos.</p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        {['Origen', 'Configuración', 'Semántica', 'Finalizado'].map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-900' : 'bg-slate-800 text-slate-500'}`}>
              {step > i + 1 ? <CheckCircle2 size={20} /> : i + 1}
            </div>
            {i < 3 && <div className={`w-24 h-1 mx-2 rounded ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Origen */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-white mb-6">Seleccione el Tipo de Origen de Datos</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {engines.map(eng => (
                <div 
                  key={eng.id}
                  onClick={() => setEngine(eng.id)}
                  className={`cursor-pointer rounded-xl border p-6 flex flex-col items-center justify-center text-center transition-all
                    ${engine === eng.id ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}
                >
                  <eng.icon className={`w-12 h-12 mb-4 ${engine === eng.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <h3 className="text-white font-medium">{eng.name}</h3>
                  <p className="text-sm text-slate-400 mt-2">{eng.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={handleNextStep1} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Configuración */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-white mb-6">Configurar Conexión: {engines.find(e=>e.id===engine)?.name}</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de la Conexión</label>
              <input 
                value={connectionName} onChange={e=>setConnectionName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" 
                placeholder="Ej. Presupuestos Q3" 
              />
            </div>

            {['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine) && (
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-950">
                <UploadCloud className="w-16 h-16 text-indigo-400 mb-4" />
                <p className="text-slate-300 mb-4">Arrastre su archivo o haga clic para seleccionar</p>
                <input type="file" 
                  accept={engine==='EXCEL'?'.xlsx': engine==='CSV'?'.csv': engine==='TXT'?'.txt': engine==='JSON'?'.json': '.xml'} 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  className="text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30" />
              </div>
            )}

            {(engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') && (
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">URL Pública del Documento</label>
                <div className="flex gap-2">
                  <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex items-center"><LinkIcon size={18} className="text-slate-400" /></div>
                  <input 
                    value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" 
                    placeholder="https://..." 
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Asegúrese de que el documento tenga permisos de lectura públicos.</p>
              </div>
            )}

            {['POSTGRESQL', 'SQLSERVER', 'ORACLE', 'INFORMIX', 'MYSQL', 'BIGQUERY', 'SNOWFLAKE', 'REDSHIFT', 'SUPABASE', 'FIREBASE', 'APPWRITE', 'POCKETBASE'].includes(engine) && (
              <div className="bg-slate-950 border border-slate-700 rounded-xl p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Host / Endpoint</label>
                  <input value={dbConfig.host} onChange={e=>setDbConfig({...dbConfig, host: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="localhost o cloud url" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Puerto</label>
                  <input type="number" value={dbConfig.port} onChange={e=>setDbConfig({...dbConfig, port: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                  <input value={dbConfig.username} onChange={e=>setDbConfig({...dbConfig, username: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                  <input type="password" value={dbConfig.password} onChange={e=>setDbConfig({...dbConfig, password: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de Base de Datos</label>
                  <input value={dbConfig.database} onChange={e=>setDbConfig({...dbConfig, database: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-4 py-2">Atrás</button>
              <button onClick={handleNextStep2} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                {isUploading ? 'Procesando...' : 'Extraer Semántica'} <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Capa Semántica */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold text-white mb-2">Capa Semántica Generada</h2>
            <p className="text-slate-400 mb-6">Hemos analizado las columnas y asignado tipos lógicos. Puede ajustarlos antes de guardar.</p>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="p-4 text-slate-300 font-medium">Columna Original</th>
                    <th className="p-4 text-slate-300 font-medium">Tipo de Dato</th>
                    <th className="p-4 text-slate-300 font-medium">Clasificación Semántica</th>
                  </tr>
                </thead>
                <tbody>
                  {semanticFields.map((field, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50">
                      <td className="p-4 text-white font-medium">{field.name}</td>
                      <td className="p-4">
                        <select 
                          value={field.type}
                          onChange={(e) => {
                            const newFields = [...semanticFields];
                            newFields[idx].type = e.target.value;
                            setSemanticFields(newFields);
                          }}
                          className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-sm outline-none focus:border-indigo-500"
                        >
                          <option value="TEXT">Texto (String)</option>
                          <option value="NUMBER">Número (Float)</option>
                          <option value="DATE">Fecha</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const newFields = [...semanticFields];
                              newFields[idx].isDimension = true;
                              newFields[idx].isMeasure = false;
                              setSemanticFields(newFields);
                            }}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${field.isDimension ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}
                          >
                            Dimensión
                          </button>
                          <button 
                            onClick={() => {
                              const newFields = [...semanticFields];
                              newFields[idx].isDimension = false;
                              newFields[idx].isMeasure = true;
                              setSemanticFields(newFields);
                            }}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${field.isMeasure ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}
                          >
                            Métrica
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white px-4 py-2">Atrás</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                {isUploading ? 'Guardando...' : 'Crear Fuente de Datos'} <Save size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Finalizado */}
        {step === 4 && (
          <div className="animate-in zoom-in duration-500 text-center py-12">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/30">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">¡Fuente de Datos Creada!</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Se ha procesado exitosamente el origen y creado su capa semántica. Ahora puede usar esta fuente para reportes cruzados o paneles analíticos.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => router.push('/datasources')} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg border border-slate-700 transition-colors">
                Ver Fuentes Semánticas
              </button>
              <button onClick={() => router.push('/reports')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                Ir a Reportes <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
