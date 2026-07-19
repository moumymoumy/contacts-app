'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Salle, Artiste, Saison } from '@/lib/types';

export default function NouveauConcertPage() {
  const router = useRouter();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [artistes, setArtistes] = useState<Artiste[]>([]);
  const [saisons, setSaisons] = useState<Saison[]>([]);

  const [date, setDate] = useState('');
  const [salleId, setSalleId] = useState('');
  const [artisteId, setArtisteId] = useState('');
  const [saisonId, setSaisonId] = useState('');
  const [genre, setGenre] = useState('');
  const [prixBillet, setPrixBillet] = useState('');
  const [billetsVendus, setBilletsVendus] = useState('');
  const [invitations, setInvitations] = useState('0');
  const [placesVip, setPlacesVip] = useState('0');
  const [commission, setCommission] = useState('0');
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    const charger = async () => {
      const [{ data: s }, { data: a }, { data: sa }] = await Promise.all([
        supabase.from('cmp_salles').select('*').order('nom'),
        supabase.from('cmp_artistes').select('*').order('nom'),
        supabase.from('cmp_saisons').select('*').order('date_debut', { ascending: false }),
      ]);
      setSalles((s as Salle[]) ?? []);
      setArtistes((a as Artiste[]) ?? []);
      setSaisons((sa as Saison[]) ?? []);
    };
    charger();
  }, []);

  const enregistrer = async () => {
    if (!date) {
      alert('La date du concert est obligatoire.');
      return;
    }
    setEnregistrement(true);
    const { data, error } = await supabase
      .from('cmp_concerts')
      .insert({
        date,
        salle_id: salleId || null,
        artiste_id: artisteId || null,
        saison_id: saisonId || null,
        genre_musical: genre || null,
        prix_billet: Number(prixBillet) || 0,
        billets_vendus: Number(billetsVendus) || 0,
        invitations: Number(invitations) || 0,
        places_vip: Number(placesVip) || 0,
        commission_billetterie_pct: Number(commission) || 0,
        statut: 'planifie',
      })
      .select()
      .single();

    setEnregistrement(false);

    if (error) {
      alert("Une erreur est survenue : " + error.message);
      return;
    }

    router.push(`/concerts/${data.id}`);
  };

  const champClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-brand-dark">Nouveau concert</h1>
      <p className="mt-1 text-sm text-gray-500">
        Remplissez les informations de base. Vous pourrez ajouter les recettes et dépenses détaillées juste après.
      </p>

      {salles.length === 0 && (
        <p className="mt-4 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
          Vous n'avez pas encore de salle enregistrée — allez dans "Paramètres" pour en ajouter une avant de continuer (recommandé, mais pas obligatoire).
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date du concert *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Saison</label>
          <select value={saisonId} onChange={(e) => setSaisonId(e.target.value)} className={champClass}>
            <option value="">—</option>
            {saisons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Salle</label>
          <select value={salleId} onChange={(e) => setSalleId(e.target.value)} className={champClass}>
            <option value="">—</option>
            {salles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom} ({s.capacite} places)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Artiste</label>
          <select value={artisteId} onChange={(e) => setArtisteId(e.target.value)} className={champClass}>
            <option value="">—</option>
            {artistes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Genre musical</label>
          <input value={genre} onChange={(e) => setGenre(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Prix du billet (€)</label>
          <input type="number" value={prixBillet} onChange={(e) => setPrixBillet(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Billets vendus</label>
          <input type="number" value={billetsVendus} onChange={(e) => setBilletsVendus(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Commission billetterie (%)</label>
          <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Invitations</label>
          <input type="number" value={invitations} onChange={(e) => setInvitations(e.target.value)} className={champClass} />
        </div>

        <div>
          <label className={labelClass}>Places VIP</label>
          <input type="number" value={placesVip} onChange={(e) => setPlacesVip(e.target.value)} className={champClass} />
        </div>
      </div>

      <button
        onClick={enregistrer}
        disabled={enregistrement}
        className="mt-6 rounded-lg bg-brand-dark px-5 py-2.5 text-sm text-white hover:bg-brand-dark/90 disabled:opacity-50"
      >
        {enregistrement ? 'Enregistrement...' : 'Créer le concert'}
      </button>
    </div>
  );
}
