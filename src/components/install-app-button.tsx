"use client";

import * as React from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function InstallAppButton() {
  const { canPromptDirectly, isInstalled, isSupported, promptInstall } = usePwaInstall();
  const [showManualInstructions, setShowManualInstructions] = React.useState(false);

  if (isInstalled) return null;

  async function handleClick() {
    if (canPromptDirectly) {
      await promptInstall();
    } else {
      setShowManualInstructions(true);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick}>
        📲 Installer l&apos;application
      </Button>

      <Dialog open={showManualInstructions} onOpenChange={setShowManualInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Installer l&apos;application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-600">
            {!isSupported ? (
              <>
                <p>
                  Ton navigateur (Safari) ne propose pas d&apos;installation automatique.
                  Voici comment faire manuellement :
                </p>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">Sur iPhone / iPad :</p>
                  <p>
                    Appuie sur l&apos;icône <strong>Partager</strong> (carré avec une flèche
                    vers le haut) dans la barre du navigateur, puis choisis{" "}
                    <strong>Sur l&apos;écran d&apos;accueil</strong>.
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">Sur Mac (Safari) :</p>
                  <p>
                    Menu <strong>Fichier</strong> → <strong>Ajouter au Dock</strong>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>
                  L&apos;installation automatique n&apos;est pas encore disponible sur cette
                  page (ça peut arriver juste après le chargement). Essaie l&apos;une de ces
                  méthodes :
                </p>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">Sur ordinateur (Chrome / Edge) :</p>
                  <p>
                    Clique sur l&apos;icône d&apos;installation ⊕ dans la barre d&apos;adresse
                    (à droite, à côté du cadenas), ou menu ⋮ → <strong>Installer
                    l&apos;application</strong>.
                  </p>
                </div>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="font-medium text-slate-800">Sur Android (Chrome) :</p>
                  <p>
                    Menu ⋮ (en haut à droite) → <strong>Ajouter à l&apos;écran
                    d&apos;accueil</strong> ou <strong>Installer l&apos;application</strong>.
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
