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

export default function DashboardPage() {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("Toutes");
  const [sources, setSources] = React.useState<string[]>([]);

  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [emailExists, setEmailExists] = React.useState(false);
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
      const { data } = await supabase
        .from("contacts")
        .select("id")
        .ilike("email", form.email.trim())
        .limit(1);
      setEmailExists(!!data && data.length > 0);
      setCheckingEmail(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [form.email]);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.nom.trim()) {
      setErrorMsg("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("contacts").insert({
      nom: form.nom.trim(),
      prenom: form.prenom.trim() || null,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      societe: form.societe.trim() || null,
      source: "Manuel",
      status: "actif",
      metadata: {},
    });
    setSaving(false);

    if (error) {
      setErrorMsg("Erreur lors de l'enregistrement : " + error.message);
      return;
    }

    setForm(EMPTY_FORM);
    setEmailExists(false);
    setShowAddDialog(false);
    fetchContacts();
    fetchSources();
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
        <Button onClick={() => setShowAddDialog(true)}>+ Ajouter un contact</Button>
      </div>

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
              </tr>
            ))}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
            </CardContent>
          </Card>
        ))}
        {!loading && contacts.length === 0 && (
          <p className="py-8 text-center text-slate-400">Aucun contact trouvé.</p>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContact} className="space-y-3">
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
