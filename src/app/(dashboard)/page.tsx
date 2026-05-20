import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Validar sesión del lado del servidor
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 2. Obtener estadísticas reales en base a la base de datos local
  const [totalReports, pendingApproval, approved, drafts] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.report.count({ where: { status: "APPROVED" } }),
    prisma.report.count({ where: { status: { in: ["DRAFT", "REJECTED"] } } }),
  ]);

  // 3. Cargar los últimos reportes generados
  const recentReports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      area: true,
      mapping: true,
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Borrador
          </span>
        );
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Revisión Pendiente
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Aprobado y Generado
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-text-main">
      {/* Saludo / Bienvenida */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hola, {session.name.split(" ")[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Aquí tienes un resumen del estado regulatorio de los reportes pilotos para la Superintendencia.
          </p>
        </div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Extracción
        </Link>
      </div>

      {/* Tarjetas de Estadísticas (Glassmorphism Premium) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Reportes */}
        <div className="group bg-card-main border border-border-main rounded-2xl p-6 shadow-xl hover:bg-bg-hover transition-all duration-300 hover:shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-mono uppercase tracking-wider">Reportes Extraídos</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{totalReports}</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">Bases operacionales conectadas</p>
        </div>

        {/* Card 2: Pendientes */}
        <div className="group bg-card-main border border-border-main rounded-2xl p-6 shadow-xl hover:bg-bg-hover transition-all duration-300 hover:shadow-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-mono uppercase tracking-wider">En Revisión / Firmas</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{pendingApproval}</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">Requieren firma del área</p>
        </div>

        {/* Card 3: Aprobados */}
        <div className="group bg-card-main border border-border-main rounded-2xl p-6 shadow-xl hover:bg-bg-hover transition-all duration-300 hover:shadow-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-mono uppercase tracking-wider">Listos para Envío XML</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{approved}</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">XMLs validados y firmados</p>
        </div>

        {/* Card 4: Borradores */}
        <div className="group bg-card-main border border-border-main rounded-2xl p-6 shadow-xl hover:bg-bg-hover transition-all duration-300 hover:shadow-rose-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-text-muted text-xs font-mono uppercase tracking-wider">Borradores / Rechazos</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{drafts}</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">Errores u observaciones pendientes</p>
        </div>
      </div>

      {/* Tabla de Reportes Recientes y Actividad */}
      <div className="bg-card-main border border-border-main rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border-main flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/5 dark:bg-slate-900/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monitoreo de Reportes Recientes</h3>
            <p className="text-text-muted text-xs mt-0.5">Control de extracción, estado de XSD y flujo de firmas por área</p>
          </div>
          <Link
            href="/reports"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-mono tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
          >
            VER TODOS LOS REPORTES
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentReports.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <svg className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold">No se han extraído reportes todavía</p>
              <p className="text-xs text-text-muted mt-1">Conecte una base de datos y cree un mapeo para comenzar.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main bg-slate-950/5 dark:bg-slate-950/40 text-text-muted font-mono text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Reporte</th>
                  <th className="px-6 py-4">Mapeo Utilizado</th>
                  <th className="px-6 py-4">Área Responsable</th>
                  <th className="px-6 py-4">Fecha Extracción</th>
                  <th className="px-6 py-4">Creador</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main text-sm text-text-main">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {report.reportCode}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {report.mapping ? report.mapping.name : "Extracción Directa / Manual"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded border border-border-main">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
                      >
                        Ver Detalle
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
