"use client";

import * as React from "react";
import { supabase, type Contact } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  societe: "",
};

// Colonnes triables et leur nom réel en base de données
const SORTABLE_COLUMNS = {
  nom: "Nom",
  prenom: "Prénom",
  email: "Email",
  telephone: "Téléphone",
  societe: "Société",
  source: "Source",
} as const;

type SortColumn = keyof typeof SORTABLE_COLUMNS | string;
type SortDirection = "asc" | "desc";

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

/** Petite flèche indiquant le sens de tri actif sur une colonne */
function SortArrow({ direction }: { direction: SortDirection }) {
  return (
    <span className="ml-1 inline-block text-slate-400">
      {direction === "asc" ? "▲" : "▼"}
    </span>
  );
}

/** Échappe une valeur pour un champ CSV (guillemets, virgules, retours à la ligne) */
function csvEscape(value: string | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export default function DashboardPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("Toutes");
  const [sources, setSources] = React.useState<string[]>([]);
  const [exporting, setExporting] = React.useState(false);

  // Colonnes personnalisées issues des champs "keep_custom" lors des imports
  // (ex: "Voix", "Niveau"...). Détectées automatiquement à partir des
  // metadata des contacts ; l'utilisateur choisit lesquelles afficher.
  const [availableCustomFields, setAvailableCustomFields] = React.useState<string[]>([]);
  const [visibleCustomFields, setVisibleCustomFields] = React.useState<string[]>([]);
  const [showColumnSettings, setShowColumnSettings] = React.useState(false);

  // Charge la préférence de colonnes visibles depuis le navigateur (persiste
  // d'une session à l'autre, uniquement côté client)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("contacts_custom_columns");
      if (saved) setVisibleCustomFields(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  function toggleCustomFieldVisibility(field: string) {
    setVisibleCustomFields((prev) => {
      const next = prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field];
      try {
        localStorage.setItem("contacts_custom_columns", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  // État du tri par colonne (par défaut : Nom, croissant — comme avant)
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("nom");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [emailExists, setEmailExists] = React.useState(false);
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Suppression groupée de toute une source (ex: tous les contacts "Wix")
  const [deleteSourceDialogOpen, setDeleteSourceDialogOpen] = React.useState(false);
  const [deleteSourceCount, setDeleteSourceCount] = React.useState<number | null>(null);
  const [deleteSourceConfirmText, setDeleteSourceConfirmText] = React.useState("");
  const [deletingSource, setDeletingSource] = React.useState(false);

  // Barre de défilement horizontale dupliquée en haut du tableau, synchronisée
  // avec le défilement réel — pratique pour scroller à la souris sans devoir
  // redescendre chercher la barre native en bas du tableau.
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = React.useState(0);
  const isSyncingScroll = React.useRef(false);

  React.useEffect(() => {
    function updateTableWidth() {
      if (tableRef.current) {
        setTableWidth(tableRef.current.scrollWidth);
      }
    }
    updateTableWidth();
    window.addEventListener("resize", updateTableWidth);
    return () => window.removeEventListener("resize", updateTableWidth);
  }, [contacts]);

  function handleTopScroll() {
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    if (topScrollRef.current && tableScrollRef.current) {
      isSyncingScroll.current = true;
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  }

  function handleTableScroll() {
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    if (topScrollRef.current && tableScrollRef.current) {
      isSyncingScroll.current = true;
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  }

  const isEditing = editingContact !== null;
  const dialogOpen = showAddDialog || isEditing;

  /** Clique sur un titre de colonne : change le tri actif, ou inverse le sens si on reclique sur la même colonne */
  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const [totalCount, setTotalCount] = React.useState<number | null>(null);

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);

    // Le tri ne peut être délégué à la base que pour les colonnes standards.
    // Pour une colonne personnalisée (issue des imports, stockée dans
    // metadata), on récupère avec un tri stable par défaut (nom), puis on
    // trie nous-mêmes côté client après réception des données.
    const isBuiltInColumn = sortColumn in SORTABLE_COLUMNS;
    const dbSortColumn = isBuiltInColumn ? sortColumn : "nom";

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("status", "actif")
      .order(dbSortColumn, { ascending: sortDirection === "asc", nullsFirst: false });

    // Requête séparée pour le VRAI total (compte exact en base), indépendante
    // de la limite ci-dessous qui ne sert qu'à l'affichage du tableau.
    // Sans ça, le total affiché plafonnait artificiellement à la limite
    // d'affichage dès que la base dépassait ce nombre de contacts.
    let countQuery = supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("status", "actif");

    if (search.trim().length > 0) {
      const term = search.trim();
      const orFilter = `nom.ilike.%${term}%,prenom.ilike.%${term}%,societe.ilike.%${term}%,telephone.ilike.%${term}%,email.ilike.%${term}%`;
      query = query.or(orFilter);
      countQuery = countQuery.or(orFilter);
    }

    if (sourceFilter !== "Toutes") {
      query = query.eq("source", sourceFilter);
      countQuery = countQuery.eq("source", sourceFilter);
    }

    const [{ data, error }, { count }] = await Promise.all([
      query.limit(5000),
      countQuery,
    ]);

    if (!error && data) {
      let result = data as Contact[];
      if (!isBuiltInColumn) {
        result = [...result].sort((a, b) => {
          const champsA = (a as unknown as { metadata?: { champs_personnalises?: Record<string, unknown> } })
            .metadata?.champs_personnalises;
          const champsB = (b as unknown as { metadata?: { champs_personnalises?: Record<string, unknown> } })
            .metadata?.champs_personnalises;
          const va = champsA?.[sortColumn] != null ? String(champsA[sortColumn]) : "";
          const vb = champsB?.[sortColumn] != null ? String(champsB[sortColumn]) : "";
          const cmp = va.localeCompare(vb, "fr");
          return sortDirection === "asc" ? cmp : -cmp;
        });
      }
      setContacts(result);
    }
    setTotalCount(count ?? null);
    setLoading(false);
  }, [search, sourceFilter, sortColumn, sortDirection]);

  const fetchSources = React.useCallback(async () => {
    const { data } = await supabase.from("contacts").select("source").eq("status", "actif");
    if (data) {
      const uniq = Array.from(new Set(data.map((d: { source: string }) => d.source).filter(Boolean)));
      setSources(uniq);
    }
  }, []);

  // Détecte tous les noms de champs personnalisés déjà utilisés (ex: "Voix",
  // "Niveau"...) en parcourant les metadata de tous les contacts actifs.
  // Utilise une cast souple (any) pour ne pas dépendre de la définition
  // exacte du type Contact dans lib/supabase.ts.
  const fetchCustomFieldNames = React.useCallback(async () => {
    const { data } = await supabase
      .from("contacts")
      .select("metadata")
      .eq("status", "actif")
      .limit(5000);
    if (data) {
      const names = new Set<string>();
      for (const row of data as { metadata: unknown }[]) {
        const champs = (row.metadata as { champs_personnalises?: Record<string, unknown> } | null)
          ?.champs_personnalises;
        if (champs) {
          for (const key of Object.keys(champs)) names.add(key);
        }
      }
      setAvailableCustomFields(Array.from(names).sort((a, b) => a.localeCompare(b, "fr")));
    }
  }, []);

  React.useEffect(() => {
    fetchSources();
    fetchCustomFieldNames();
  }, [fetchSources, fetchCustomFieldNames]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      fetchContacts();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchContacts]);

  React.useEffect(() => {
    if (!form.email || form.email.trim().length < 3) {
      setEmailExists(false);
      return;
    }
    setCheckingEmail(true);
    const timeout = setTimeout(async () => {
      let query = supabase
        .from("contacts")
        .select("id")
        .ilike("email", form.email.trim())
        .limit(1);
      // En mode édition, on ignore le contact qu'on est en train de modifier lui-même
      if (isEditing && editingContact) {
        query = query.neq("id", editingContact.id);
      }
      const { data } = await query;
      setEmailExists(!!data && data.length > 0);
      setCheckingEmail(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [form.email, isEditing, editingContact]);

  function openAddDialog() {
    setForm(EMPTY_FORM);
    setEditingContact(null);
    setErrorMsg(null);
    setShowAddDialog(true);
  }

  function openEditDialog(contact: Contact) {
    setForm({
      nom: contact.nom ?? "",
      prenom: contact.prenom ?? "",
      email: contact.email ?? "",
      telephone: contact.telephone ?? "",
      societe: contact.societe ?? "",
    });
    setEditingContact(contact);
    setErrorMsg(null);
    setShowAddDialog(false);
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditingContact(null);
    setForm(EMPTY_FORM);
    setEmailExists(false);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.nom.trim()) {
      setErrorMsg("Le nom est obligatoire.");
      return;
    }

    setSaving(true);

    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim() || null,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      societe: form.societe.trim() || null,
    };

    let error;
    if (isEditing && editingContact) {
      ({ error } = await supabase.from("contacts").update(payload).eq("id", editingContact.id));
    } else {
      ({ error } = await supabase.from("contacts").insert({
        ...payload,
        source: "Manuel",
        status: "actif",
        metadata: {},
      }));
    }

    setSaving(false);

    if (error) {
      setErrorMsg("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

    closeDialog();
    fetchContacts();
    fetchSources();
  }

  async function handleDelete(contactId: string) {
    setDeletingId(contactId);
    const { error } = await supabase.from("contacts").delete().eq("id", contactId);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (error) {
      setErrorMsg("Erreur lors de la suppression : " + error.message);
      return;
    }
    fetchContacts();
    fetchSources();
  }

  /**
   * Ouvre la modale de confirmation pour supprimer TOUS les contacts d'une
   * source (celle actuellement sélectionnée dans le filtre). On récupère
   * d'abord le nombre exact de contacts concernés (tous statuts confondus,
   * y compris ceux "à vérifier") pour l'afficher clairement avant de
   * demander confirmation.
   */
  async function openDeleteSourceDialog() {
    setErrorMsg(null);
    setDeleteSourceConfirmText("");
    setDeleteSourceCount(null);
    setDeleteSourceDialogOpen(true);

    const { count, error } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("source", sourceFilter);

    if (error) {
      setErrorMsg("Erreur lors du comptage : " + error.message);
      setDeleteSourceDialogOpen(false);
      return;
    }
    setDeleteSourceCount(count ?? 0);
  }

  function closeDeleteSourceDialog() {
    setDeleteSourceDialogOpen(false);
    setDeleteSourceConfirmText("");
    setDeleteSourceCount(null);
  }

  async function handleDeleteSource() {
    if (deleteSourceConfirmText !== sourceFilter) return;

    setDeletingSource(true);
    const { error } = await supabase.from("contacts").delete().eq("source", sourceFilter);
    setDeletingSource(false);

    if (error) {
      setErrorMsg("Erreur lors de la suppression de la source : " + error.message);
      return;
    }

    closeDeleteSourceDialog();
    setSourceFilter("Toutes");
    fetchContacts();
    fetchSources();
  }

  async function handleExport() {
    setExporting(true);
    setErrorMsg(null);

    // On exporte TOUS les contacts actifs (pas seulement ceux affichés/filtrés à l'écran)
    // .limit() explicite pour éviter une limite par défaut cachée de Supabase
    // qui tronquerait silencieusement l'export une fois la base bien grande.
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("status", "actif")
      .order("nom", { ascending: true })
      .limit(20000);

    setExporting(false);

    if (error || !data) {
      setErrorMsg("Erreur lors de l'export : " + (error?.message ?? "données introuvables"));
      return;
    }

    const headers = ["Nom", "Prenom", "Email", "Telephone", "Societe", "Source"];
    const lines = [headers.join(",")];

    for (const c of data as Contact[]) {
      lines.push(
        [
          csvEscape(c.nom),
          csvEscape(c.prenom),
          csvEscape(c.email),
          csvEscape(c.telephone),
          csvEscape(c.societe),
          csvEscape(c.source),
        ].join(",")
      );
    }

    // Ajout du BOM UTF-8 pour un affichage correct des accents dans Excel
    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `contacts-export-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">
            {loading
              ? "Chargement..."
              : `${totalCount ?? contacts.length} contact(s) actif(s)`}
            {!loading && totalCount !== null && totalCount > contacts.length && (
              <span className="ml-1 text-amber-600">
                (affichage limité aux {contacts.length} premiers)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <DownloadIcon />
            {exporting ? "Export..." : "Exporter (CSV)"}
          </Button>
          <Button onClick={openAddDialog}>+ Ajouter un contact</Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Rechercher (nom, prénom, société, email, téléphone)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
        />
        <Select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="sm:max-w-xs"
        >
          <option value="Toutes">Toutes les sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {availableCustomFields.length > 0 && (
          <div className="relative shrink-0">
            <Button variant="outline" onClick={() => setShowColumnSettings((s) => !s)}>
              ⚙️ Colonnes personnalisées
            </Button>
            {showColumnSettings && (
              <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                  Champs issus des imports
                </p>
                <div className="space-y-1">
                  {availableCustomFields.map((field) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCustomFields.includes(field)}
                        onChange={() => toggleCustomFieldVisibility(field)}
                      />
                      {field}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {sourceFilter !== "Toutes" && (
          <Button
            variant="destructive"
            onClick={openDeleteSourceDialog}
            className="shrink-0"
          >
            🗑️ Supprimer toute la source « {sourceFilter} »
          </Button>
        )}
      </div>

      {/* Vue tableau (desktop) */}
      {/* Barre de défilement horizontale dupliquée en haut, synchronisée avec
          le tableau en dessous — permet de scroller à la souris sans devoir
          chercher la barre native tout en bas du tableau. */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="hidden overflow-x-auto overflow-y-hidden md:block"
        style={{ height: 14 }}
      >
        <div style={{ width: tableWidth, height: 1 }} />
      </div>
      <Card className="hidden md:block">
        <div ref={tableScrollRef} onScroll={handleTableScroll} className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {(Object.keys(SORTABLE_COLUMNS) as (keyof typeof SORTABLE_COLUMNS)[]).map((col) => (
                <th
                  key={col}
                  className="cursor-pointer select-none px-4 py-3 hover:text-slate-700"
                  onClick={() => handleSort(col)}
                  title="Cliquer pour trier"
                >
                  {SORTABLE_COLUMNS[col]}
                  {sortColumn === col && <SortArrow direction={sortDirection} />}
                </th>
              ))}
              {visibleCustomFields.map((field) => (
                <th
                  key={field}
                  className="cursor-pointer select-none px-4 py-3 hover:text-slate-700"
                  onClick={() => handleSort(field)}
                  title="Cliquer pour trier"
                >
                  {field}
                  {sortColumn === field && <SortArrow direction={sortDirection} />}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.nom}</td>
                <td className="px-4 py-3">{c.prenom ?? "—"}</td>
                <td className="max-w-[220px] truncate px-4 py-3" title={c.email ?? undefined}>{c.email ?? "—"}</td>
                <td className="px-4 py-3">{c.telephone ?? "—"}</td>
                <td className="max-w-[220px] truncate px-4 py-3" title={c.societe ?? undefined}>{c.societe ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{c.source}</Badge>
                </td>
                {visibleCustomFields.map((field) => {
                  const champs = (c as unknown as { metadata?: { champs_personnalises?: Record<string, unknown> } })
                    .metadata?.champs_personnalises;
                  const value = champs?.[field];
                  return (
                    <td key={field} className="max-w-[180px] truncate px-4 py-3" title={value ? String(value) : undefined}>
                      {value ? String(value) : "—"}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Modifier"
                      onClick={() => openEditDialog(c)}
                    >
                      <PencilIcon />
                    </Button>
                    {confirmDeleteId === c.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}
                        >
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Supprimer"
                        onClick={() => setConfirmDeleteId(c.id)}
                      >
                        <TrashIcon />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={7 + visibleCustomFields.length} className="px-4 py-8 text-center text-slate-400">
                  Aucun contact trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Vue cartes (mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {contacts.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {c.nom} {c.prenom}
                </p>
                <Badge variant="outline">{c.source}</Badge>
              </div>
              <p className="text-sm text-slate-500">{c.email ?? "Pas d'email"}</p>
              <p className="text-sm text-slate-500">{c.telephone ?? "Pas de téléphone"}</p>
              {c.societe && <p className="text-sm text-slate-500">{c.societe}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(c)}>
                  <PencilIcon /> Modifier
                </Button>
                {confirmDeleteId === c.id ? (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id)}
                    >
                      Confirmer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(c.id)}>
                    <TrashIcon /> Supprimer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && contacts.length === 0 && (
          <p className="py-8 text-center text-slate-400">Aucun contact trouvé.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier le contact" : "Ajouter un contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nom *</label>
              <Input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Prénom</label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {checkingEmail && (
                <p className="mt-1 text-xs text-slate-400">Vérification...</p>
              )}
              {!checkingEmail && emailExists && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠ Cet email existe déjà dans la base. Vous pouvez tout de même
                  enregistrer ce contact ; il faudra le résoudre depuis l&apos;écran
                  Doublons si besoin.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Téléphone</label>
              <Input
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Société</label>
              <Input
                value={form.societe}
                onChange={(e) => setForm({ ...form, societe: e.target.value })}
              />
            </div>
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteSourceDialogOpen} onOpenChange={(open) => !open && closeDeleteSourceDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer toute la source « {sourceFilter} »</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deleteSourceCount === null ? (
              <p className="text-sm text-slate-500">Calcul en cours...</p>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Vous êtes sur le point de supprimer <strong>définitivement {deleteSourceCount} contact(s)</strong>{" "}
                de la source « {sourceFilter} », y compris ceux en attente de vérification
                (doublons) le cas échéant. Cette action est <strong>irréversible</strong>.
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Pour confirmer, tapez exactement <strong>{sourceFilter}</strong> ci-dessous :
              </label>
              <Input
                value={deleteSourceConfirmText}
                onChange={(e) => setDeleteSourceConfirmText(e.target.value)}
                placeholder={sourceFilter}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDeleteSourceDialog}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                disabled={deleteSourceConfirmText !== sourceFilter || deletingSource || deleteSourceCount === null}
                onClick={handleDeleteSource}
              >
                {deletingSource ? "Suppression..." : "Supprimer définitivement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
