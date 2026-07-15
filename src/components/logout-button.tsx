"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setVisible(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setVisible(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!visible) return null;

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Déconnexion
    </Button>
  );
}
