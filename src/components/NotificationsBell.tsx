"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  content: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar notificaciones desde la API
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.error("❌ Error al cargar notificaciones:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling ligero cada 15 segundos para simular tiempo real
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id?: number) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("❌ Error al marcar como leído:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
      router.refresh();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ALERT":
        return (
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "SUCCESS":
        return (
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "REJECTION":
        return (
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-bg-inner dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-border-main rounded-xl hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown flotante (Glassmorphic) */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 rounded-2xl bg-card-main border border-border-main shadow-2xl backdrop-blur-xl z-50 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border-main flex items-center justify-between bg-slate-900/5 dark:bg-slate-900/20">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h3>
              <p className="text-[11px] text-text-muted mt-0.5 font-mono">Alertas y firmas de área</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => handleMarkAsRead()}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer font-mono"
              >
                Leído Todo
              </button>
            )}
          </div>

          {/* Listado */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border-main/50">
            {notifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-muted">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5" />
                </svg>
                <p className="text-xs font-medium">Bandeja de entrada vacía</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Te avisaremos cuando haya novedades en tus reportes.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 flex gap-3 hover:bg-bg-hover transition-colors duration-150 cursor-pointer relative ${!n.isRead ? "bg-indigo-500/[0.02]" : ""}`}
                >
                  {!n.isRead && (
                    <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  )}
                  {getNotificationIcon(n.type)}
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className={`text-xs leading-normal ${!n.isRead ? "font-semibold text-slate-900 dark:text-white" : "text-text-main"}`}>
                      {n.content}
                    </p>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                      {new Date(n.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} - {new Date(n.createdAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
