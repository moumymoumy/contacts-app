'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Concert, Salle, Artiste, Revenu, DepenseOperationnelle } from '@/lib/types';
import { calculerResultatConcert, formaterMontant } from '@/lib/calculs/rentabiliteConcert';
import StatusBadge from '@/components/StatusBadge';
import { Trash2, Plus } from 'lucide-react';

const TYPES_REVENUS = ['Bar', 'Sponsor', 'Subvention', 'Merchandising', 'Autre'];
const CATEGORIES_DEPENSES = [
  'Cachet artiste', 'Assurance', 'Électricité/Eau/Internet', 'Impression', 'Communication',
  'Location matériel', 'Techniciens', 'Sécurité', 'Transport', 'Hébergement', 'Catering', 'Autre',
];

export default function FicheConcertPage({ params }: { params: { id: string } }) {
  const [concert, setConcert] = useState<Concert | null>(null);
  const [salle, setSalle] = useState<Salle | null>(null);
  const [artiste, setArtiste] = useState<Artiste | null>(null);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [depenses, setDepenses] = useState<DepenseOperationnelle[]>([]);
  const [chargement, setChargement] = useState(true);

  const [typeRevenu, setTypeRevenu] = useState(TYPES_REVENUS[0]);
  const [montantRevenu, setMontantRevenu] = useState('');
  const [categorieDepense, setCategorieDepense] = useState(CATEGORIES_DEPENSES[0]);
  const [montantDepense, setMontantDepense] = useState('');

  const charger = useCallback(async () => {
    const { data: c } = await supabase.from('cmp_concerts').select('*').eq('id', params.id).single();
    if (!c) {
      setChargement(false);
      return;
    }
    setConcert(c as Concert);

    const [{ data: s }, { data: a }, { data: rev }, { data: dep }] = await Promise.all([
      c.salle_id ? supabase.from('cmp_salles').select('*').eq('id', c.salle_id).single() : Promise.resolve({ data: null }),
      c.artiste_id ? supabase.from('cmp_artistes').select('*').eq('id', c.artiste_id).single() : Promise.resolve({ data: null }),
      supabase.from('cmp_revenus').select('*').eq('concert_id', params.id),
      supabase.from('cmp_depenses_operationnelles').select('*').eq('concert_id', params.id),
    ]);

    setSalle((s as Salle) ?? null);
    setArtiste((a as Artiste) ?? null);
    setRevenus((rev as Revenu[]) ?? []);
    setDepenses((dep as DepenseOperationnelle[]) ?? []);
    setChargement(false);
  }, [params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ajouterRevenu = async () => {
    if (!montantRevenu) return;
    await supabase.from('cmp_revenus').insert({
      concert_id: params.id,
      type: typeRevenu,
      montant: Number(montantRevenu),
    });
    setMontantRevenu('');
    charger();
  };

  const supprimerRevenu = async (id: string) => {
    await supabase.from('cmp_revenus').delete().eq('id', id);
    charger();
  };

  const ajouterDepense = async () => {
    if (!montantDepense) return;
    await supabase.from('cmp_depenses_operationnelles').insert({
      concert_id: params.id,
      categorie: categorieDepense,
      montant: Number(montantDepense),
    });
    setMontantDepense('');
    charger();
  };

  const supprimerDepense = async (id: string) => {
    await supabase.from('cmp_depenses_operationnelles').delete().eq('id', id);
    charger();
  };

  if (chargement) return <p className="text-sm text-gray-400">Chargement...</p>;
  if (!concert) return <p className="text-sm text-gray-400">Concert introuvable.</p>;

  const resultat = calculerResultatConcert(concert, revenus, depenses, salle?.capacite ?? 0);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark">
            {artiste?.nom ?? 'Concert'} — {new Date(concert.date).toLocaleDateString('fr-FR')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {salle?.nom ?? 'Salle non renseignée'} {salle?.capacite ? `· ${salle.capacite} places` : ''}
          </p>
        </div>
        <StatusBadge statut={resultat.statutRentabilite} />
      </div>

      {/* KPI résumé */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Revenu total" valeur={formaterMontant(resultat.revenuTotal)} />
        <Kpi label="Coûts opérationnels" valeur={formaterMontant(resultat.coutsOperationnels)} />
        <Kpi label="Résultat opérationnel" valeur={formaterMontant(resultat.resultatOperationnel)} accent />
        <Kpi label="Taux de remplissage" valeur={`${resultat.tauxRemplissage.toFixed(0)} %`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Billetterie (résumé lecture seule, vient du formulaire de création) */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-dark">Billetterie</h2>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>CA brut : {formaterMontant(resultat.caBrutBilletterie)}</p>
            <p>Commission ({concert.commission_billetterie_pct}%) : -{formaterMontant(resultat.commissionBilletterie)}</p>
            <p className="font-medium text-brand-dark">CA net billetterie : {formaterMontant(resultat.caNetBilletterie)}</p>
            <p className="mt-2 text-xs text-gray-400">
              {concert.billets_vendus} billets vendus · {concert.invitations} invitations · {concert.places_vip} VIP
            </p>
          </div>
        </div>

        {/* Autres revenus */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-brand-dark">Autres recettes (bar, sponsors...)</h2>
          <div className="mt-3 flex gap-2">
            <select value={typeRevenu} onChange={(e) => setTypeRevenu(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
              {TYPES_REVENUS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Montant €"
              value={montantRevenu}
              onChange={(e) => setMontantRevenu(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
            <button onClick={ajouterRevenu} className="rounded-lg bg-brand-dark px-3 py-1.5 text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 divide-y divide-gray-100">
            {revenus.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span>{r.type} — {formaterMontant(r.montant)}</span>
                <button onClick={() => supprimerRevenu(r.id)} className="text-gray-300 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dépenses opérationnelles */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-dark">Dépenses opérationnelles de la soirée</h2>
          <div className="mt-3 flex gap-2">
            <select value={categorieDepense} onChange={(e) => setCategorieDepense(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
              {CATEGORIES_DEPENSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Montant €"
              value={montantDepense}
              onChange={(e) => setMontantDepense(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
            <button onClick={ajouterDepense} className="rounded-lg bg-brand-dark px-3 py-1.5 text-white">
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {depenses.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-b border-gray-50 py-2 text-sm">
                <span>{d.categorie} — {formaterMontant(d.montant)}</span>
                <button onClick={() => supprimerDepense(d.id)} className="text-gray-300 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-brand-dark' : 'text-gray-700'}`}>{valeur}</p>
    </div>
  );
}
