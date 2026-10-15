"use client";

import React, { useState, useEffect } from "react";
import { FlowcraftEditor } from "@/components/editor/FlowcraftEditor";
import { LoginGate } from "@/components/auth/LoginGate";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setAuthRequired(Boolean(data.authRequired));
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      // In case of error, assume auth required if in prod
      setAuthRequired(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <span className="text-xs font-medium">Loading Flowcraft Studio...</span>
      </div>
    );
  }

  if (authRequired && !isAuthenticated) {
    return <LoginGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <FlowcraftEditor authRequired={authRequired} onLogout={handleLogout} />;
}
