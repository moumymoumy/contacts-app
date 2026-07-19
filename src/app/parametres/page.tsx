'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Salle, Artiste, Saison } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';

type Onglet = 'salles' | 'artistes' | 'saisons';

export default function ParametresPage() {
  const [onglet, setOnglet] = useState<Onglet>('salles');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Configuration & paramètres</h1>
      <p className="mt-1 text-sm text-gray-500">
        Salles, artistes et saisons — ces informations serviront de base pour vos concerts.
      </p>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {(['salles', 'artistes', 'saisons'] as Onglet[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              onglet === tab
                ? 'border-brand-dark text-brand-dark'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {onglet === 'salles' && <GestionSalles />}
        {onglet === 'artistes' && <GestionArtistes />}
        {onglet === 'saisons' && <GestionSaisons />}
      </div>
    </div>
  );
}

function GestionSalles() {
  const [salles, setSalles] = useState<Salle[]>([]);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [capacite, setCapacite] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    const { data } = await supabase.from('cmp_salles').select('*').order('nom');
    setSalles((data as Salle[]) ?? []);
    setChargement(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!nom.trim()) return;
    await supabase.from('cmp_salles').insert({
      nom,
      adresse: adresse || null,
      capacite: Number(capacite) || 0,
    });
    setNom('');
    setAdresse('');
    setCapacite('');
    charger();
  };

  const supprimer = async (id: string) => {
    await supabase.from('cmp_salles').delete().eq('id', id);
    charger();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          placeholder="Nom de la salle"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Adresse (optionnel)"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Capacité"
          type="number"
          value={capacite}
          onChange={(e) => setCapacite(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={ajouter}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm text-white hover:bg-brand-dark/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="mt-6 divide-y divide-gray-100">
        {chargement && <p className="text-sm text-gray-400">Chargement...</p>}
        {!chargement && salles.length === 0 && (
          <p className="text-sm text-gray-400">Aucune salle enregistrée pour l'instant.</p>
        )}
        {salles.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-brand-dark">{s.nom}</p>
              <p className="text-xs text-gray-400">
                {s.adresse ? `${s.adresse} · ` : ''}Capacité : {s.capacite} places
              </p>
            </div>
            <button onClick={() => supprimer(s.id)} className="text-gray-300 hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GestionArtistes() {
  const [artistes, setArtistes] = useState<Artiste[]>([]);
  const [nom, setNom] = useState('');
  const [genre, setGenre] = useState('');
  const [contact, setContact] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    const { data } = await supabase.from('cmp_artistes').select('*').order('nom');
    setArtistes((data as Artiste[]) ?? []);
    setChargement(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!nom.trim()) return;
    await supabase.from('cmp_artistes').insert({
      nom,
      genre_musical: genre || null,
      contact: contact || null,
    });
    setNom('');
    setGenre('');
    setContact('');
    charger();
  };

  const supprimer = async (id: string) => {
    await supabase.from('cmp_artistes').delete().eq('id', id);
    charger();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          placeholder="Nom de l'artiste"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Genre musical"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Contact (optionnel)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={ajouter}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm text-white hover:bg-brand-dark/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="mt-6 divide-y divide-gray-100">
        {chargement && <p className="text-sm text-gray-400">Chargement...</p>}
        {!chargement && artistes.length === 0 && (
          <p className="text-sm text-gray-400">Aucun artiste enregistré pour l'instant.</p>
        )}
        {artistes.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-brand-dark">{a.nom}</p>
              <p className="text-xs text-gray-400">{a.genre_musical || '—'}</p>
            </div>
            <button onClick={() => supprimer(a.id)} className="text-gray-300 hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GestionSaisons() {
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [nom, setNom] = useState('');
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    const { data } = await supabase.from('cmp_saisons').select('*').order('date_debut', { ascending: false });
    setSaisons((data as Saison[]) ?? []);
    setChargement(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!nom.trim()) return;
    await supabase.from('cmp_saisons').insert({
      nom,
      date_debut: debut || null,
      date_fin: fin || null,
    });
    setNom('');
    setDebut('');
    setFin('');
    charger();
  };

  const supprimer = async (id: string) => {
    await supabase.from('cmp_saisons').delete().eq('id', id);
    charger();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          placeholder='Nom (ex: "2025-2026")'
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          onClick={ajouter}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm text-white hover:bg-brand-dark/90"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="mt-6 divide-y divide-gray-100">
        {chargement && <p className="text-sm text-gray-400">Chargement...</p>}
        {!chargement && saisons.length === 0 && (
          <p className="text-sm text-gray-400">Aucune saison enregistrée pour l'instant.</p>
        )}
        {saisons.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-brand-dark">{s.nom}</p>
              <p className="text-xs text-gray-400">
                {s.date_debut || '?'} → {s.date_fin || '?'}
              </p>
            </div>
            <button onClick={() => supprimer(s.id)} className="text-gray-300 hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
