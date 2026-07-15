"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export const DB_FIELDS = [
  { value: "nom", label: "Nom *" },
  { value: "prenom", label: "Prénom" },
  { value: "email", label: "Email" },
  { value: "telephone", label: "Téléphone" },
  { value: "societe", label: "Société" },
  { value: "ignore", label: "-- Ignorer cette colonne --" },
] as const;

export type DbFieldValue = (typeof DB_FIELDS)[number]["value"];

export type ColumnMapping = Record<string, DbFieldValue>;

interface CsvMapperProps {
  headers: string[];
  previewRows: string[][];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

/**
 * Devine automatiquement le champ DB correspondant à un en-tête de colonne CSV,
 * en se basant sur des correspondances courantes issues de Wix, Mailchimp, Excel.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const dictionary: Record<string, DbFieldValue> = {
    nom: "nom",
    "last name": "nom",
    lastname: "nom",
    surname: "nom",
    prenom: "prenom",
    prénom: "prenom",
    "first name": "prenom",
    firstname: "prenom",
    email: "email",
    "email address": "email",
    mail: "email",
    "e-mail": "email",
    telephone: "telephone",
    téléphone: "telephone",
    phone: "telephone",
    "phone number": "telephone",
    tel: "telephone",
    mobile: "telephone",
    societe: "societe",
    société: "societe",
    company: "societe",
    organization: "societe",
    entreprise: "societe",
  };

  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const key = header.trim().toLowerCase();
    mapping[header] = dictionary[key] ?? "ignore";
  }
  return mapping;
}

export function CsvMapper({ headers, previewRows, mapping, onMappingChange }: CsvMapperProps) {
  function updateMapping(header: string, value: DbFieldValue) {
    onMappingChange({ ...mapping, [header]: value });
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 align-top">
                  <div className="mb-2 truncate font-semibold text-slate-700" title={h}>
                    {h}
                  </div>
                  <Select
                    value={mapping[h] ?? "ignore"}
                    onChange={(e) => updateMapping(h, e.target.value as DbFieldValue)}
                    className="w-full text-xs"
                  >
                    {DB_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 text-slate-500">
                {row.map((cell, j) => (
                  <td key={j} className="max-w-[180px] truncate px-3 py-2" title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
