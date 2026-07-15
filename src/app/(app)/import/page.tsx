"use client";

import * as React from "react";
import { supabase, type ContactInsert } from "@/lib/supabase";
import { parseCsv } from "@/lib/csv";
import {
  CsvMapper,
  guessMapping,
  type ColumnMapping,
} from "@/components/csv-mapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Step = "upload" | "mapping" | "importing" | "done";

interface ImportSummary {
  total: number;
  actif: number;
  aVerifier: number;
  ignores: number;
  erreurs: number;
}

export default function ImportPage() {
  const [step, setStep] = React.useState<Step>("upload");
  const [fileName, setFileName] = React.useState("");
  const [sourceName, setSourceName] = React.useState("Import_Excel");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<ColumnMapping>({});
  const [dragOver, setDragOver] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [summary, setSummary] = React.useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  function handleFile(file: File) {
    setErrorMsg(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const { headers: parsedHeaders, rows: parsedRows } = parseCsv(text);
        if (parsedHeaders.length === 0) {
          setErrorMsg("Impossible de lire les colonnes du fichier. Vérifiez le format CSV.");
          return;
        }
        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setMapping(guessMapping(parsedHeaders));
        setStep("mapping");
      } catch {
        setErrorMsg("Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un CSV valide.");
      }
    };
    reader.onerror = () => setErrorMsg("Erreur lors de la lecture du fichier.");
    reader.readAsText(file, "utf-8");
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function runImport() {
    setStep("importing");
    setProgress(0);
    setErrorMsg(null);

    const reverseMapping: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== "ignore") reverseMapping[field] = header;
    }

    const nomHeader = reverseMapping["nom"];
    if (!nomHeader) {
      setErrorMsg("Vous devez associer au moins une colonne au champ 'Nom' avant d'importer.");
      setStep("mapping");
      return;
    }

    const headerIndex: Record<string, number> = {};
    headers.forEach((h, i) => (headerIndex[h] = i));

    let actif = 0;
    let aVerifier = 0;
    let ignores = 0;
    let erreurs = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const getValue = (field: string): string | null => {
        const header = reverseMapping[field];
        if (!header) return null;
        const value = row[headerIndex[header]];
        return value && value.trim().length > 0 ? value.trim() : null;
      };

      const nom = getValue("nom");
      if (!nom) {
        ignores++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      const email = getValue("email");
      let existingId: string | null = null;

      if (email) {
        const { data: existingByEmail } = await supabase
          .from("contacts")
          .select("id")
          .ilike("email", email)
          .limit(1)
          .maybeSingle();
        if (existingByEmail) existingId = existingByEmail.id as string;
      }

      if (!existingId) {
        const prenom = getValue("prenom");
        const { data: existingByName } = await supabase
          .from("contacts")
          .select("id")
          .ilike("nom", nom)
          .ilike("prenom", prenom ?? "")
          .limit(1)
          .maybeSingle();
        if (existingByName) existingId = existingByName.id as string;
      }

      const payload: ContactInsert = {
        nom,
        prenom: getValue("prenom"),
        email,
        telephone: getValue("telephone"),
        societe: getValue("societe"),
        source: sourceName || "Import_Excel",
        status: existingId ? "a_verifier" : "actif",
        metadata: { import_raw: Object.fromEntries(headers.map((h, idx) => [h, row[idx] ?? ""])) },
        duplicate_of: existingId,
      };

      const { error } = await supabase.from("contacts").insert(payload);
      if (error) {
        erreurs++;
      } else if (existingId) {
        aVerifier++;
      } else {
        actif++;
      }

      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setSummary({ total: rows.length, actif, aVerifier, ignores, erreurs });
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setSummary(null);
    setErrorMsg(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importer des contacts</h1>
        <p className="text-sm text-slate-500">
          Chargez un fichier CSV (export Wix, Mailchimp, Excel...) puis associez les
          colonnes aux champs de la base. Aucune donnée n&apos;est fusionnée
          automatiquement.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {step === "upload" && (
        <Card>
          <CardContent>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                Nom de la source (ex: Wix, Mailchimp, Import_Excel)
              </label>
              <Input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver ? "border-slate-500 bg-slate-50" : "border-slate-300"
              }`}
            >
              <p className="text-slate-500">
                Glissez-déposez votre fichier CSV ici, ou
              </p>
              <label className="cursor-pointer">
                <span className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">
                  Choisir un fichier
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </label>
              <p className="text-xs text-slate-400">Formats acceptés : .csv (UTF-8)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Fichier : <span className="font-medium text-slate-700">{fileName}</span> —{" "}
              {rows.length} ligne(s) détectée(s)
            </p>
            <Button variant="outline" onClick={reset}>
              Changer de fichier
            </Button>
          </div>
          <CsvMapper
            headers={headers}
            previewRows={rows.slice(0, 5)}
            mapping={mapping}
            onMappingChange={setMapping}
          />
          <div className="flex justify-end">
            <Button onClick={runImport}>Lancer l&apos;importation ({rows.length} lignes)</Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <Card>
          <CardContent>
            <p className="mb-3 text-sm text-slate-600">Importation en cours...</p>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-slate-400">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {step === "done" && summary && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold">Importation terminée</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{summary.total} lignes traitées</Badge>
              <Badge variant="success">{summary.actif} ajoutés (actif)</Badge>
              <Badge variant="warning">{summary.aVerifier} à vérifier (doublons)</Badge>
              {summary.ignores > 0 && (
                <Badge variant="outline">{summary.ignores} ignorées (sans nom)</Badge>
              )}
              {summary.erreurs > 0 && (
                <Badge variant="danger">{summary.erreurs} erreurs</Badge>
              )}
            </div>
            {summary.aVerifier > 0 && (
              <p className="text-sm text-slate-600">
                {summary.aVerifier} contact(s) ressemblent à des fiches déjà existantes.
                Rendez-vous dans l&apos;écran{" "}
                <a href="/doublons" className="font-medium text-slate-900 underline">
                  Doublons
                </a>{" "}
                pour les résoudre.
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={reset}>Importer un autre fichier</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                Voir les contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
