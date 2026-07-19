'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Concert, Salle, Artiste, Revenu, DepenseOperationnelle } from '@/lib/types';
import { calculerResultatConcert, formaterMontant } from '@/lib/calculs/rentabiliteConcert';
import StatusBadge from '@/components/StatusBadge';

const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface LigneConcert {
  concert: Concert;
  salle: Salle | null;
  artiste: Artiste | null;
  revenuTotal: number;
  resultatOperationnel: number;
  tauxRemplissage: number;
  statut: 'rentable' | 'equilibre' | 'perte';
}

export default function CalendrierPage() {
  const [lignes, setLignes] = useState<LigneConcert[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const [{ data: concerts }, { data: salles }, { data: artistes }, { data: revenus }, { data: depenses }] =
        await Promise.all([
          supabase.from('cmp_concerts').select('*').order('date'),
          supabase.from('cmp_salles').select('*'),
          supabase.from('cmp_artistes').select('*'),
          supabase.from('cmp_revenus').select('*'),
          supabase.from('cmp_depenses_operationnelles').select('*'),
        ]);

      const sallesMap = new Map((salles as Salle[] ?? []).map((s) => [s.id, s]));
      const artistesMap = new Map((artistes as Artiste[] ?? []).map((a) => [a.id, a]));

      const result: LigneConcert[] = ((concerts as Concert[]) ?? []).map((concert) => {
        const salle = sallesMap.get(concert.salle_id ?? '') ?? null;
        const artiste = artistesMap.get(concert.artiste_id ?? '') ?? null;
        const revenusConcert = ((revenus as Revenu[]) ?? []).filter((r) => r.concert_id === concert.id);
        const depensesConcert = ((depenses as DepenseOperationnelle[]) ?? []).filter((d) => d.concert_id === concert.id);
        const resultat = calculerResultatConcert(concert, revenusConcert, depensesConcert, salle?.capacite ?? 0);

        return {
          concert,
          salle,
          artiste,
          revenuTotal: resultat.revenuTotal,
          resultatOperationnel: resultat.resultatOperationnel,
          tauxRemplissage: resultat.tauxRemplissage,
          statut: resultat.statutRentabilite,
        };
      });

      setLignes(result);
      setChargement(false);
    };

    charger();
  }, []);

  // Regroupement par année puis par mois
  const parAnnee = new Map<number, Map<number, LigneConcert[]>>();
  for (const ligne of lignes) {
    const d = new Date(ligne.concert.date);
    const annee = d.getFullYear();
    const mois = d.getMonth();
    if (!parAnnee.has(annee)) parAnnee.set(annee, new Map());
    const parMois = parAnnee.get(annee)!;
    if (!parMois.has(mois)) parMois.set(mois, []);
    parMois.get(mois)!.push(ligne);
  }

  const annees = [...parAnnee.keys()].sort((a, b) => b - a);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Calendrier & planning</h1>
      <p className="mt-1 text-sm text-gray-500">Vue de vos concerts, regroupés par mois et par année.</p>

      {chargement && <p className="mt-6 text-sm text-gray-400">Chargement...</p>}

      {!chargement && lignes.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-600">Aucun concert planifié pour l'instant</p>
        </div>
      )}

      {annees.map((annee) => {
        const parMois = parAnnee.get(annee)!;
        const moisTries = [...parMois.keys()].sort((a, b) => a - b);
        const cumulAnnuel = [...parMois.values()].flat().reduce((t, l) => t + l.resultatOperationnel, 0);
        const caAnnuel = [...parMois.values()].flat().reduce((t, l) => t + l.revenuTotal, 0);

        return (
          <div key={annee} className="mt-8">
            <div className="flex items-center justify-between rounded-xl bg-brand-dark px-6 py-4 text-white">
              <h2 className="text-lg font-semibold">{annee}</h2>
              <div className="flex gap-6 text-sm">
                <span>CA cumulé : {formaterMontant(caAnnuel)}</span>
                <span>Résultat cumulé : {formaterMontant(cumulAnnuel)}</span>
              </div>
            </div>

            {moisTries.map((mois) => (
              <div key={mois} className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500">{MOIS_FR[mois]}</h3>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {parMois.get(mois)!.map(({ concert, salle, artiste, revenuTotal, resultatOperationnel, tauxRemplissage, statut }) => (
                    <Link
                      key={concert.id}
                      href={`/concerts/${concert.id}`}
                      className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-brand-dark">{artiste?.nom ?? 'Sans artiste'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(concert.date).toLocaleDateString('fr-FR')} · {salle?.nom ?? 'Sans salle'}
                          </p>
                        </div>
                        <StatusBadge statut={statut} />
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-gray-500">
                        <span>CA : {formaterMontant(revenuTotal)}</span>
                        <span>Résultat : {formaterMontant(resultatOperationnel)}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Remplissage : {tauxRemplissage.toFixed(0)} %
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
