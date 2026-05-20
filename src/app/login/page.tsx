"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirigir al dashboard si ya hay una sesión activa
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.push("/");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión.");
      }

      // Redirigir al dashboard principal
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ayudante de llenado rápido para facilitar las pruebas locales
  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("Vision123*");
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 overflow-hidden font-sans">
      {/* Círculos flotantes de fondo decorativos (Efecto Glassmorphism Premium) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative w-full max-w-md px-6 z-10">
        {/* Encabezado / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-2xl shadow-lg shadow-indigo-500/20 mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Vision<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Super</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestor de Reportes - Superintendencia de Subsidio Familiar
          </p>
        </div>

        {/* Tarjeta de Login (Vidrio Esmerilado) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Correo Institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@visionsuper.com"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Autenticando..." : "Ingresar al Portal"}
            </button>
          </form>

          {/* Separador de acceso rápido */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-500 tracking-wider">
                Acceso de Prueba Rápido
              </span>
            </div>
          </div>

          {/* Botones de llenado rápido por Roles */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickFill("admin@visionsuper.com")}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 hover:text-white text-xs text-left transition-all duration-150 flex justify-between items-center"
            >
              <span>🔑 Carlos (Administrador Global)</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">ADMIN</span>
            </button>
            <button
              onClick={() => handleQuickFill("analista.fin@visionsuper.com")}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 hover:text-white text-xs text-left transition-all duration-150 flex justify-between items-center"
            >
              <span>📋 Juan (Analista Financiero)</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">ANALYST</span>
            </button>
            <button
              onClick={() => handleQuickFill("revisor.fin1@visionsuper.com")}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-300 hover:text-white text-xs text-left transition-all duration-150 flex justify-between items-center"
            >
              <span>🛡️ María (Revisora Financiera)</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px]">APPROVER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
