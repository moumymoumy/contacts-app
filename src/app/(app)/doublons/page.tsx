"use client";

import * as React from "react";
import { supabase, type Contact } from "@/lib/supabase";
import {
  DuplicateCard,
  getDefaultSelections,
  type FieldSelections,
} from "@/components/duplicate-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DuplicatePair {
  existing: Contact;
  imported: Contact;
}

export default function DoublonsPage() {
  const [pairs, setPairs] = React.useState<DuplicatePair[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Choix "existant / importé" pour chaque champ, par paire de doublon
  // (clé = id de la fiche importée). Contrôlé ici pour que le bouton
  // "Tout fusionner" puisse réutiliser exactement les mêmes choix que
  // ceux affichés sur chaque carte.
  const [selectionsMap, setSelectionsMap] = React.useState<Record<string, FieldSelections>>({});

  // Confirmation en 2 temps avant la fusion globale (action groupée et
  // irréversible, même principe que la suppression individuelle)
  const [confirmMergeAll, setConfirmMergeAll] = React.useState(false);
  const [mergingAll, setMergingAll] = React.useState(false);

  const fetchDuplicates = React.useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data: importedContacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("status", "a_verifier")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg("Erreur lors du chargement des doublons : " + error.message);
      setLoading(false);
      return;
    }

    const imported = (importedContacts ?? []) as Contact[];
    const existingIds = Array.from(
      new Set(imported.map((c) => c.duplicate_of).filter((id): id is string => !!id))
    );

    if (existingIds.length === 0) {
      setPairs([]);
      setSelectionsMap({});
      setLoading(false);
      return;
    }

    const { data: existingContacts, error: existingError } = await supabase
      .from("contacts")
      .select("*")
      .in("id", existingIds);

    if (existingError) {
      setErrorMsg("Erreur lors du chargement des fiches existantes : " + existingError.message);
      setLoading(false);
      return;
    }

    const existingMap = new Map(
      ((existingContacts ?? []) as Contact[]).map((c) => [c.id, c])
    );

    const built: DuplicatePair[] = [];
    const initialSelections: Record<string, FieldSelections> = {};
    for (const imp of imported) {
      if (imp.duplicate_of && existingMap.has(imp.duplicate_of)) {
        const existingContact = existingMap.get(imp.duplicate_of)!;
        built.push({ existing: existingContact, imported: imp });
        initialSelections[imp.id] = getDefaultSelections(existingContact, imp);
      }
    }

    setPairs(built);
    setSelectionsMap(initialSelections);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  function handleSelectionsChange(importedId: string, next: FieldSelections) {
    setSelectionsMap((prev) => ({ ...prev, [importedId]: next }));
  }

  async function handleIgnore(importedId: string) {
    setBusyId(importedId);
    const { error } = await supabase
      .from("contacts")
      .update({ status: "actif", duplicate_of: null })
      .eq("id", importedId);
    setBusyId(null);
    if (error) {
      setErrorMsg("Erreur : " + error.message);
      return;
    }
    setPairs((prev) => prev.filter((p) => p.imported.id !== importedId));
  }

  async function handleDelete(importedId: string) {
    setBusyId(importedId);
    const { error } = await supabase.from("contacts").delete().eq("id", importedId);
    setBusyId(null);
    if (error) {
      setErrorMsg("Erreur : " + error.message);
      return;
    }
    setPairs((prev) => prev.filter((p) => p.imported.id !== importedId));
  }

  async function handleMerge(
    existingId: string,
    importedId: string,
    selections: FieldSelections
  ) {
    setBusyId(importedId);

    const pair = pairs.find((p) => p.imported.id === importedId);
    if (!pair) {
      setBusyId(null);
      return;
    }

    const fields: (keyof Contact)[] = ["nom", "prenom", "email", "telephone", "societe"];
    const updatePayload: Record<string, unknown> = {};
    for (const field of fields) {
      const choice = selections[field as string];
      updatePayload[field] =
        choice === "imported" ? pair.imported[field] : pair.existing[field];
    }

    const { error: updateError } = await supabase
      .from("contacts")
      .update(updatePayload)
      .eq("id", existingId);

    if (updateError) {
      setErrorMsg("Erreur lors de la fusion : " + updateError.message);
      setBusyId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", importedId);

    setBusyId(null);

    if (deleteError) {
      setErrorMsg("La fusion a été appliquée mais la fiche importée n'a pas pu être supprimée : " + deleteError.message);
      return;
    }

    setPairs((prev) => prev.filter((p) => p.imported.id !== importedId));
  }

  /**
   * Applique "Fusionner avec les valeurs choisies" à toute la liste, en
   * réutilisant pour chaque carte les choix actuellement sélectionnés
   * (ou les choix par défaut si l'utilisateur n'a rien changé). Les autres
   * actions (Ignorer, Supprimer) restent inchangées et disponibles au cas
   * par cas, ce bouton ne fait qu'appliquer "Fusionner" à tout le monde.
   */
  async function handleMergeAll() {
    if (!confirmMergeAll) {
      setConfirmMergeAll(true);
      return;
    }

    setMergingAll(true);
    setErrorMsg(null);
    setConfirmMergeAll(false);

    const toMerge = [...pairs];
    let erreurs = 0;

    for (const pair of toMerge) {
      const selections = selectionsMap[pair.imported.id] ?? getDefaultSelections(pair.existing, pair.imported);
      try {
        await handleMerge(pair.existing.id, pair.imported.id, selections);
      } catch {
        erreurs++;
      }
    }

    setMergingAll(false);

    // On resynchronise avec la base au cas où une fusion aurait échoué
    // silencieusement (ex : fiche déjà modifiée entre-temps ailleurs).
    await fetchDuplicates();

    if (erreurs > 0) {
      setErrorMsg(`${erreurs} fusion(s) ont échoué et nécessitent une résolution manuelle ci-dessous.`);
    }
  }

  const anyBusy = busyId !== null || mergingAll;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Résolution des doublons</h1>
          <p className="text-sm text-slate-500">
            Comparez chaque fiche importée à la fiche existante et choisissez comment
            résoudre le conflit. Rien n&apos;est modifié tant que vous ne validez pas une
            action.
          </p>
        </div>
        {pairs.length > 0 && (
          <div className="flex shrink-0 items-center gap-2">
            {confirmMergeAll && !mergingAll && (
              <Button variant="ghost" onClick={() => setConfirmMergeAll(false)}>
                Annuler
              </Button>
            )}
            <Button
              variant={confirmMergeAll ? "destructive" : "success"}
              disabled={anyBusy}
              onClick={handleMergeAll}
            >
              {mergingAll
                ? "Fusion en cours..."
                : confirmMergeAll
                ? `Confirmer la fusion de ${pairs.length} doublon(s) ?`
                : "Tout fusionner avec les valeurs choisies"}
            </Button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Chargement...</p>}

      {!loading && pairs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-slate-400">
            Aucun doublon en attente de résolution. 🎉
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {pairs.map((pair) => (
          <DuplicateCard
            key={pair.imported.id}
            existing={pair.existing}
            imported={pair.imported}
            selections={
              selectionsMap[pair.imported.id] ?? getDefaultSelections(pair.existing, pair.imported)
            }
            onSelectionsChange={(next) => handleSelectionsChange(pair.imported.id, next)}
            onIgnore={handleIgnore}
            onDelete={handleDelete}
            onMerge={handleMerge}
            busy={busyId === pair.imported.id || mergingAll}
          />
        ))}
      </div>
    </div>
  );
}
