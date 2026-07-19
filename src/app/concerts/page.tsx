'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Concert, Salle, Artiste, Revenu, DepenseOperationnelle } from '@/lib/types';
import { calculerResultatConcert, formaterMontant } from '@/lib/calculs/rentabiliteConcert';
import StatusBadge from '@/components/StatusBadge';
import { Plus } from 'lucide-react';

interface LigneConcert {
  concert: Concert;
  salle: Salle | null;
  artiste: Artiste | null;
  resultatOperationnel: number;
  statut: 'rentable' | 'equilibre' | 'perte';
}

export default function ConcertsPage() {
  const [lignes, setLignes] = useState<LigneConcert[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const [{ data: concerts }, { data: salles }, { data: artistes }, { data: revenus }, { data: depenses }] =
        await Promise.all([
          supabase.from('cmp_concerts').select('*').order('date', { ascending: false }),
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
          resultatOperationnel: resultat.resultatOperationnel,
          statut: resultat.statutRentabilite,
        };
      });

      setLignes(result);
      setChargement(false);
    };

    charger();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark">Gestion des concerts</h1>
          <p className="mt-1 text-sm text-gray-500">Liste de vos concerts et leur rentabilité.</p>
        </div>
        <Link
          href="/concerts/nouveau"
          className="flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-sm text-white hover:bg-brand-dark/90"
        >
          <Plus size={16} /> Nouveau concert
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
        {chargement && <p className="p-6 text-sm text-gray-400">Chargement...</p>}

        {!chargement && lignes.length === 0 && (
          <p className="p-6 text-sm text-gray-400">
            Aucun concert enregistré. Cliquez sur "Nouveau concert" pour commencer.
          </p>
        )}

        {!chargement && lignes.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Artiste</th>
                <th className="px-6 py-3">Salle</th>
                <th className="px-6 py-3">Résultat opérationnel</th>
                <th className="px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ concert, salle, artiste, resultatOperationnel, statut }) => (
                <tr
                  key={concert.id}
                  onClick={() => (window.location.href = `/concerts/${concert.id}`)}
                  className="cursor-pointer border-b border-gray-50 hover:bg-surface-light"
                >
                  <td className="px-6 py-4">{new Date(concert.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">{artiste?.nom ?? '—'}</td>
                  <td className="px-6 py-4">{salle?.nom ?? '—'}</td>
                  <td className="px-6 py-4 font-medium">{formaterMontant(resultatOperationnel)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge statut={statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
