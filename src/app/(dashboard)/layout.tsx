import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // 1. Verificar la sesión del lado del servidor (impide flashes de contenido no autorizado)
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 2. Obtener la información del usuario en tiempo real desde la base de datos local
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { area: true },
  });

  if (!user) {
    redirect("/login");
  }

  const formattedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    area: user.area ? { id: user.area.id, name: user.area.name } : null,
  };

  return (
    <div className="flex min-h-screen bg-bg-main text-text-main font-sans selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-300">
      {/* Círculos de luz flotantes y difuminados de fondo en el panel principal */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 dark:bg-indigo-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] bg-emerald-600/5 dark:bg-emerald-600/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Sidebar de navegación */}
      <Sidebar user={formattedUser} />

      {/* Área de Contenido Principal */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 overflow-y-auto h-screen">
        {/* Cabecera superior simple con el estado y hora actual */}
        <header className="px-8 py-5 border-b border-border-header bg-header-main backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors duration-300">
          <div>
            <h2 className="text-sm font-semibold tracking-wide font-mono">
              PORTAL REGULATORIO INTERNO
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Superintendencia de Subsidio Familiar (Colombia)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs font-mono text-text-muted bg-bg-inner px-3 py-1.5 rounded-lg border border-border-main transition-colors duration-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Conexión Segura
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Piloto 2-001A y 2-002A</span>
            </div>
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Cuerpo de la Página */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
