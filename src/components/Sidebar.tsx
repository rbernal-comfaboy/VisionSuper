"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  area: { id: number; name: string } | null;
}

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "Conexiones BD",
      path: "/connections",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: "Fuentes de Datos",
      path: "/datasources",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      name: "Wizard Data Integrator",
      path: "/wizard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      name: "Mapeador SQL-XSD",
      path: "/mappings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      name: "Extracción y Reportes",
      path: "/reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Analytics Studio",
      path: "/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Flujos BPM",
      path: "/bpm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "ANALYST":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "APPROVER":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "ANALYST":
        return "Analista";
      case "APPROVER":
        return "Aprobador";
      default:
        return role;
    }
  };

  return (
    <aside className="w-80 bg-slate-950/80 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Top Section */}
      <div className="flex flex-col flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-8">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-xl shadow-md shadow-indigo-500/10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
              Vision<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Super</span>
            </span>
            <span className="block text-[10px] text-slate-500 font-mono tracking-widest leading-none uppercase mt-0.5">
              Superintendencia SSF
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 flex-1">
          <span className="block text-[10px] font-semibold uppercase text-slate-500 tracking-wider px-3 mb-2 font-mono">
            Menú Principal
          </span>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium ${
                  isActive
                    ? "bg-white/10 text-white border-l-2 border-indigo-500 shadow-lg shadow-black/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className={`transition-colors duration-200 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-md shadow-indigo-400/50"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout Section */}
      <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
        {/* User Card */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-semibold text-sm shadow-inner shadow-black/30 font-mono border border-white/10 uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="text-sm font-semibold text-white truncate leading-tight">
                {user.name}
              </h4>
              <span className="text-xs text-slate-400 truncate block mt-0.5">
                {user.email}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono tracking-wide ${getRoleBadgeClass(user.role)}`}>
              {getRoleName(user.role)}
            </span>
            {user.area && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium truncate max-w-[140px] border border-white/5">
                {user.area.name}
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all duration-200 text-sm font-semibold hover:shadow-lg hover:shadow-rose-950/10 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isLoggingOut ? "Saliendo..." : "Cerrar Sesión"}
        </button>
      </div>
    </aside>
  );
}
