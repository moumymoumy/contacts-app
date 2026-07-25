"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<"checking" | "authenticated" | "redirecting">(
    "checking"
  );

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setStatus("authenticated");
      } else {
        setStatus("redirecting");
        window.location.href = "/login";
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus("redirecting");
        window.location.href = "/login";
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-400">
        Vérification de la session...
      </div>
    );
  }

  return <>{children}</>;
}
