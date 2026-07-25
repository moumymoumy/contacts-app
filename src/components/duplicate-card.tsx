"use client";

import * as React from "react";
import { Contact } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof Contact; label: string }[] = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "email", label: "Email" },
  { key: "telephone", label: "Téléphone" },
  { key: "societe", label: "Société" },
];

export type FieldChoice = "existing" | "imported";
export type FieldSelections = Record<string, FieldChoice>;

interface DuplicateCardProps {
  existing: Contact;
  imported: Contact;
  onIgnore: (importedId: string) => void;
  onDelete: (importedId: string) => void;
  onMerge: (existingId: string, importedId: string, selections: FieldSelections) => void;
  busy?: boolean;
}

export function DuplicateCard({
  existing,
  imported,
  onIgnore,
  onDelete,
  onMerge,
  busy,
}: DuplicateCardProps) {
  // Par défaut, on garde les valeurs existantes sauf si le champ existant est vide
  const initialSelections: FieldSelections = {};
  for (const f of FIELDS) {
    const existingVal = existing[f.key];
    initialSelections[f.key] = existingVal ? "existing" : "imported";
  }
  const [selections, setSelections] = React.useState<FieldSelections>(initialSelections);

  function isDifferent(key: keyof Contact) {
    return (existing[key] ?? "") !== (imported[key] ?? "");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Doublon suspecté : {existing.nom} {existing.prenom}
        </CardTitle>
        <Badge variant="warning">Source import : {imported.source}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Fiche existante */}
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Fiche existante en base
            </p>
            {FIELDS.map((f) => (
              <FieldRow
                key={f.key}
                label={f.label}
                value={existing[f.key] as string | null}
                highlighted={isDifferent(f.key)}
                selected={selections[f.key] === "existing"}
                onSelect={() =>
                  setSelections((s) => ({ ...s, [f.key]: "existing" }))
                }
              />
            ))}
          </div>

          {/* Fiche importée */}
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <p className="text-xs font-semibold uppercase text-amber-600">
              Fiche importée (en attente)
            </p>
            {FIELDS.map((f) => (
              <FieldRow
                key={f.key}
                label={f.label}
                value={imported[f.key] as string | null}
                highlighted={isDifferent(f.key)}
                selected={selections[f.key] === "imported"}
                onSelect={() =>
                  setSelections((s) => ({ ...s, [f.key]: "imported" }))
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onIgnore(imported.id)}
          >
            Garder les deux (ignorer)
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => onDelete(imported.id)}
          >
            Supprimer le nouveau
          </Button>
          <Button
            variant="success"
            disabled={busy}
            onClick={() => onMerge(existing.id, imported.id, selections)}
          >
            Fusionner avec les valeurs choisies
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  label,
  value,
  highlighted,
  selected,
  onSelect,
}: {
  label: string;
  value: string | null;
  highlighted: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start rounded-md border px-3 py-2 text-left transition-colors",
        selected
          ? "border-slate-900 bg-slate-900/5"
          : "border-transparent hover:bg-slate-100",
        highlighted && !selected && "ring-1 ring-amber-300"
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {label}
        {highlighted && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">différent</Badge>}
        {selected && <Badge variant="default" className="px-1.5 py-0 text-[10px]">retenu</Badge>}
      </span>
      <span className="text-sm text-slate-800">{value || <em className="text-slate-300">(vide)</em>}</span>
    </button>
  );
}
