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

  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [emailExists, setEmailExists] = React.useState(false);
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const isEditing = editingContact !== null;
  const dialogOpen = showAddDialog || isEditing;

  const fetchContacts = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("status", "actif")
      .order("nom", { ascending: true });

    if (search.trim().length > 0) {
      const term = search.trim();
      query = query.or(
        `nom.ilike.%${term}%,prenom.ilike.%${term}%,societe.ilike.%${term}%,telephone.ilike.%${term}%,email.ilike.%${term}%`
      );
    }

    if (sourceFilter !== "Toutes") {
      query = query.eq("source", sourceFilter);
    }

    const { data, error } = await query.limit(500);
    if (!error && data) {
      setContacts(data as Contact[]);
    }
    setLoading(false);
  }, [search, sourceFilter]);

  const fetchSources = React.useCallback(async () => {
    const { data } = await supabase.from("contacts").select("source").eq("status", "actif");
    if (data) {
      const uniq = Array.from(new Set(data.map((d: { source: string }) => d.source).filter(Boolean)));
      setSources(uniq);
    }
  }, []);

  React.useEffect(() => {
    fetchSources();
  }, [fetchSources]);

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

  async function handleExport() {
    setExporting(true);
    setErrorMsg(null);

    // On exporte TOUS les contacts actifs (pas seulement ceux affichés/filtrés à l'écran)
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("status", "actif")
      .order("nom", { ascending: true });

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
            {loading ? "Chargement..." : `${contacts.length} contact(s) actif(s)`}
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

      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      {/* Vue tableau (desktop) */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Société</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.nom}</td>
                <td className="px-4 py-3">{c.prenom ?? "—"}</td>
                <td className="px-4 py-3">{c.email ?? "—"}</td>
                <td className="px-4 py-3">{c.telephone ?? "—"}</td>
                <td className="px-4 py-3">{c.societe ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{c.source}</Badge>
                </td>
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
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Aucun contact trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
    </div>
  );
}
