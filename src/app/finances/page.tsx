'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Concert, Salle, Revenu, DepenseOperationnelle } from '@/lib/types';
import { calculerResultatConcert, formaterMontant } from '@/lib/calculs/rentabiliteConcert';

const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const COULEURS = ['#1E2A47', '#4A6491', '#22A559', '#F0A93E', '#E5484D', '#8884d8'];

export default function FinancesPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [depenses, setDepenses] = useState<DepenseOperationnelle[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const [{ data: c }, { data: s }, { data: r }, { data: d }] = await Promise.all([
        supabase.from('cmp_concerts').select('*').order('date'),
        supabase.from('cmp_salles').select('*'),
        supabase.from('cmp_revenus').select('*'),
        supabase.from('cmp_depenses_operationnelles').select('*'),
      ]);
      setConcerts((c as Concert[]) ?? []);
      setSalles((s as Salle[]) ?? []);
      setRevenus((r as Revenu[]) ?? []);
      setDepenses((d as DepenseOperationnelle[]) ?? []);
      setChargement(false);
    };
    charger();
  }, []);

  const sallesMap = useMemo(() => new Map(salles.map((s) => [s.id, s])), [salles]);

  // Ventilation des recettes par type (Billetterie + Bar/Sponsor/...)
  const recettesParType = useMemo(() => {
    const totaux = new Map<string, number>();
    for (const concert of concerts) {
      const caNet = concert.prix_billet * concert.billets_vendus * (1 - concert.commission_billetterie_pct / 100);
      totaux.set('Billetterie', (totaux.get('Billetterie') ?? 0) + caNet);
    }
    for (const r of revenus) {
      totaux.set(r.type, (totaux.get(r.type) ?? 0) + r.montant);
    }
    return [...totaux.entries()].map(([type, montant]) => ({ type, montant: Math.round(montant) }));
  }, [concerts, revenus]);

  // Ventilation des dépenses par catégorie
  const depensesParCategorie = useMemo(() => {
    const totaux = new Map<string, number>();
    for (const d of depenses) {
      totaux.set(d.categorie, (totaux.get(d.categorie) ?? 0) + d.montant);
    }
    return [...totaux.entries()]
      .map(([categorie, montant]) => ({ categorie, montant: Math.round(montant) }))
      .sort((a, b) => b.montant - a.montant);
  }, [depenses]);

  // Évolution mensuelle (recettes, dépenses, résultat, trésorerie cumulée)
  const evolutionMensuelle = useMemo(() => {
    const parMois = new Map<string, { recettes: number; depenses: number }>();
    for (const concert of concerts) {
      const d = new Date(concert.date);
      const cle = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const salle = sallesMap.get(concert.salle_id ?? '');
      const revenusConcert = revenus.filter((r) => r.concert_id === concert.id);
      const depensesConcert = depenses.filter((dp) => dp.concert_id === concert.id);
      const resultat = calculerResultatConcert(concert, revenusConcert, depensesConcert, salle?.capacite ?? 0);

      if (!parMois.has(cle)) parMois.set(cle, { recettes: 0, depenses: 0 });
      const entree = parMois.get(cle)!;
      entree.recettes += resultat.revenuTotal;
      entree.depenses += resultat.coutsOperationnels;
    }

    const clesTriees = [...parMois.keys()].sort();
    let tresorerieCumulee = 0;
    return clesTriees.map((cle) => {
      const [annee, mois] = cle.split('-');
      const { recettes, depenses: dep } = parMois.get(cle)!;
      const resultat = recettes - dep;
      tresorerieCumulee += resultat;
      return {
        label: `${MOIS_FR[Number(mois)]} ${annee}`,
        recettes: Math.round(recettes),
        depenses: Math.round(dep),
        resultat: Math.round(resultat),
        tresorerie: Math.round(tresorerieCumulee),
      };
    });
  }, [concerts, revenus, depenses, sallesMap]);

  if (chargement) return <p className="text-sm text-gray-400">Chargement...</p>;

  if (concerts.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Finances avancées</h1>
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-600">Aucune donnée pour l'instant</p>
          <p className="mt-1 text-xs text-gray-400">Créez des concerts pour voir apparaître vos finances ici.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Finances avancées</h1>
      <p className="mt-1 text-sm text-gray-500">
        Ventilation des recettes/dépenses et évolution de votre trésorerie estimée.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recettes par type */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-dark">Recettes par catégorie</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recettesParType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formaterMontant(v)} />
                <Bar dataKey="montant" fill="#22A559" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dépenses par catégorie */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-dark">Dépenses par catégorie</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depensesParCategorie}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="categorie" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formaterMontant(v)} />
                <Bar dataKey="montant" fill="#E5484D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution mensuelle */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-dark">Évolution mensuelle</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formaterMontant(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="recettes" name="Recettes" stroke="#22A559" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="#E5484D" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resultat" name="Résultat" stroke="#1E2A47" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trésorerie estimée */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-dark">Trésorerie cumulée estimée</h2>
          <p className="mt-1 text-xs text-gray-400">
            Somme progressive des résultats mensuels — donne une idée de la tendance, pas un relevé bancaire exact.
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionMensuelle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formaterMontant(v)} />
                <Line type="monotone" dataKey="tresorerie" name="Trésorerie cumulée" stroke="#4A6491" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
