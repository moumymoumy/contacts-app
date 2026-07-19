'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Salle } from '@/lib/types';
import {
  ParametresSimulation,
  ScenarioNom,
  calculerSimulation,
  appliquerScenario,
  formaterMontant,
} from '@/lib/calculs/simulateur';

const SCENARIOS: { id: ScenarioNom; label: string }[] = [
  { id: 'pessimiste', label: 'Pessimiste (-30%)' },
  { id: 'normal', label: 'Normal' },
  { id: 'optimiste', label: 'Optimiste (+30%)' },
  { id: 'salle_complete', label: 'Salle complète' },
  { id: 'festival', label: 'Festival' },
  { id: 'gratuit', label: 'Concert gratuit' },
];

const DEFAUT: ParametresSimulation = {
  prixBillet: 20,
  spectateurs: 150,
  cachetArtiste: 1500,
  commissionPct: 10,
  coutsFixesAutres: 800,
  coutVariableParSpectateur: 0,
  nombreAnnuelConcerts: 12,
};

export default function SimulateurPage() {
  const [params, setParams] = useState<ParametresSimulation>(DEFAUT);
  const [salles, setSalles] = useState<Salle[]>([]);
  const [salleId, setSalleId] = useState('');

  useEffect(() => {
    supabase
      .from('cmp_salles')
      .select('*')
      .order('nom')
      .then(({ data }) => setSalles((data as Salle[]) ?? []));
  }, []);

  const salleSelectionnee = salles.find((s) => s.id === salleId);
  const resultat = calculerSimulation(params);

  const champ = (key: keyof ParametresSimulation, label: string, step = 1) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={params[key]}
        onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Simulateur de concert</h1>
      <p className="mt-1 text-sm text-gray-500">
        Testez différents scénarios avant de programmer un concert.
      </p>

      {/* Scénarios rapides */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setParams(appliquerScenario(params, s.id, salleSelectionnee?.capacite))}
            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-dark hover:text-brand-dark"
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setParams(DEFAUT)}
          className="rounded-full bg-surface-light px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Réinitialiser
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulaire */}
        <div className="lg:col-span-1 space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Salle (optionnel, pour "Salle complète")
            </label>
            <select
              value={salleId}
              onChange={(e) => setSalleId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {salles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.capacite} places)
                </option>
              ))}
            </select>
          </div>

          {champ('prixBillet', 'Prix du billet (€)', 0.5)}
          {champ('spectateurs', 'Nombre de spectateurs estimé')}
          {champ('cachetArtiste', 'Cachet artiste (€)')}
          {champ('commissionPct', 'Commission billetterie (%)', 0.5)}
          {champ('coutsFixesAutres', 'Autres coûts fixes de la soirée (€)')}
          {champ('coutVariableParSpectateur', 'Coût variable / spectateur (€)', 0.5)}
          {champ('nombreAnnuelConcerts', 'Nombre de concerts / an')}
        </div>

        {/* Résultats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Kpi label="CA net billetterie" valeur={formaterMontant(resultat.caNet)} />
            <Kpi label="Coûts totaux" valeur={formaterMontant(resultat.coutsTotal)} />
            <Kpi
              label="Résultat estimé"
              valeur={formaterMontant(resultat.resultat)}
              accent
              positif={resultat.resultat >= 0}
            />
            <Kpi label="Marge prévisionnelle" valeur={`${resultat.marge.toFixed(1)} %`} />
            <Kpi
              label="Seuil de rentabilité"
              valeur={
                resultat.seuilRentabiliteSpectateurs !== null
                  ? `${resultat.seuilRentabiliteSpectateurs} spectateurs`
                  : 'Non atteignable'
              }
            />
            <Kpi label="Résultat annuel estimé" valeur={formaterMontant(resultat.resultatAnnuelEstime)} />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-brand-dark">Détail du calcul</h2>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>CA brut billetterie : {formaterMontant(resultat.caBrut)}</p>
              <p>- Commission billetterie : {formaterMontant(resultat.commission)}</p>
              <p className="font-medium text-brand-dark">= CA net : {formaterMontant(resultat.caNet)}</p>
              <p className="mt-2">Cachet + coûts fixes : {formaterMontant(resultat.coutsFixesTotal)}</p>
              <p>+ Coûts variables totaux : {formaterMontant(resultat.coutsVariablesTotal)}</p>
              <p className="font-medium text-brand-dark">= Coûts totaux : {formaterMontant(resultat.coutsTotal)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  valeur,
  accent,
  positif,
}: {
  label: string;
  valeur: string;
  accent?: boolean;
  positif?: boolean;
}) {
  const couleur = accent ? (positif ? 'text-success' : 'text-danger') : 'text-gray-700';
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${couleur}`}>{valeur}</p>
    </div>
  );
}
