'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Concert, Salle, Revenu, DepenseOperationnelle } from '@/lib/types';
import { calculerResultatConcert, formaterMontant } from '@/lib/calculs/rentabiliteConcert';

export default function DashboardPage() {
  const [chargement, setChargement] = useState(true);
  const [kpis, setKpis] = useState({
    chiffreAffaires: 0,
    resultatOperationnel: 0,
    margeMoyenne: 0,
    nbConcerts: 0,
    spectateursMoyen: 0,
    tauxRemplissageMoyen: 0,
    coutMoyenSoiree: 0,
  });

  useEffect(() => {
    const charger = async () => {
      const [{ data: concerts }, { data: salles }, { data: revenus }, { data: depenses }] = await Promise.all([
        supabase.from('cmp_concerts').select('*'),
        supabase.from('cmp_salles').select('*'),
        supabase.from('cmp_revenus').select('*'),
        supabase.from('cmp_depenses_operationnelles').select('*'),
      ]);

      const sallesMap = new Map((salles as Salle[] ?? []).map((s) => [s.id, s]));
      const listeConcerts = (concerts as Concert[]) ?? [];

      if (listeConcerts.length === 0) {
        setChargement(false);
        return;
      }

      const resultats = listeConcerts.map((concert) => {
        const salle = sallesMap.get(concert.salle_id ?? '');
        const revenusConcert = ((revenus as Revenu[]) ?? []).filter((r) => r.concert_id === concert.id);
        const depensesConcert = ((depenses as DepenseOperationnelle[]) ?? []).filter((d) => d.concert_id === concert.id);
        return calculerResultatConcert(concert, revenusConcert, depensesConcert, salle?.capacite ?? 0);
      });

      const nbConcerts = resultats.length;
      const chiffreAffaires = resultats.reduce((t, r) => t + r.revenuTotal, 0);
      const resultatOperationnel = resultats.reduce((t, r) => t + r.resultatOperationnel, 0);
      const margeMoyenne = resultats.reduce((t, r) => t + r.marge, 0) / nbConcerts;
      const spectateursMoyen = resultats.reduce((t, r) => t + r.nbSpectateursTotal, 0) / nbConcerts;
      const tauxRemplissageMoyen = resultats.reduce((t, r) => t + r.tauxRemplissage, 0) / nbConcerts;
      const coutMoyenSoiree = resultats.reduce((t, r) => t + r.coutsOperationnels, 0) / nbConcerts;

      setKpis({
        chiffreAffaires,
        resultatOperationnel,
        margeMoyenne,
        nbConcerts,
        spectateursMoyen,
        tauxRemplissageMoyen,
        coutMoyenSoiree,
      });
      setChargement(false);
    };

    charger();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Tableau de bord</h1>
      <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de votre activité.</p>

      {chargement && <p className="mt-6 text-sm text-gray-400">Chargement...</p>}

      {!chargement && kpis.nbConcerts === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-600">Aucun concert enregistré pour l'instant</p>
          <p className="mt-1 text-xs text-gray-400">
            Créez votre premier concert dans le module "Concerts" pour voir apparaître vos indicateurs ici.
          </p>
        </div>
      )}

      {!chargement && kpis.nbConcerts > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Kpi label="Chiffre d'affaires" valeur={formaterMontant(kpis.chiffreAffaires)} />
          <Kpi label="Résultat opérationnel" valeur={formaterMontant(kpis.resultatOperationnel)} accent />
          <Kpi label="Marge moyenne" valeur={`${kpis.margeMoyenne.toFixed(1)} %`} />
          <Kpi label="Nombre de concerts" valeur={String(kpis.nbConcerts)} />
          <Kpi label="Spectateurs moyens" valeur={kpis.spectateursMoyen.toFixed(0)} />
          <Kpi label="Taux de remplissage moyen" valeur={`${kpis.tauxRemplissageMoyen.toFixed(0)} %`} />
          <Kpi label="Coût moyen d'une soirée" valeur={formaterMontant(kpis.coutMoyenSoiree)} />
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400">
        Les graphiques d'évolution mensuelle et le classement des artistes arriveront à l'étape suivante.
      </p>
    </div>
  );
}

function Kpi({ label, valeur, accent }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? 'text-brand-dark' : 'text-gray-700'}`}>{valeur}</p>
    </div>
  );
}
