'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { calculerSimulation, formaterMontant } from '@/lib/calculs/simulateur';

export default function PointMortPage() {
  const [cachetArtiste, setCachetArtiste] = useState(1500);
  const [coutsFixesAutres, setCoutsFixesAutres] = useState(800);
  const [commissionPct, setCommissionPct] = useState(10);
  const [coutVariable, setCoutVariable] = useState(0);

  const [prixCentral, setPrixCentral] = useState(20);
  const [pasPrix, setPasPrix] = useState(5);
  const [spectateursCentral, setSpectateursCentral] = useState(150);
  const [pasSpectateurs, setPasSpectateurs] = useState(30);

  const prix = [-2, -1, 0, 1, 2].map((i) => Math.max(0, prixCentral + i * pasPrix));
  const spectateurs = [-2, -1, 0, 1, 2, 3].map((i) => Math.max(0, spectateursCentral + i * pasSpectateurs));

  const resultatCase = (p: number, s: number) =>
    calculerSimulation({
      prixBillet: p,
      spectateurs: s,
      cachetArtiste,
      commissionPct,
      coutsFixesAutres,
      coutVariableParSpectateur: coutVariable,
      nombreAnnuelConcerts: 1,
    }).resultat;

  const couleurCase = (resultat: number) => {
    if (resultat > 0) return 'bg-success/20 text-success';
    if (resultat === 0) return 'bg-warning/20 text-warning';
    return 'bg-danger/20 text-danger';
  };

  // Courbe de point mort classique : résultat en fonction du nombre de spectateurs, au prix central
  const donneesCourbe = useMemo(() => {
    const max = spectateursCentral * 2;
    const points = [];
    for (let s = 0; s <= max; s += Math.max(1, Math.round(max / 20))) {
      points.push({
        spectateurs: s,
        resultat: Math.round(
          calculerSimulation({
            prixBillet: prixCentral,
            spectateurs: s,
            cachetArtiste,
            commissionPct,
            coutsFixesAutres,
            coutVariableParSpectateur: coutVariable,
            nombreAnnuelConcerts: 1,
          }).resultat
        ),
      });
    }
    return points;
  }, [prixCentral, spectateursCentral, cachetArtiste, commissionPct, coutsFixesAutres, coutVariable]);

  const champ = (
    valeur: number,
    onChange: (v: number) => void,
    label: string,
    step = 1
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark">Point mort & sensibilité</h1>
      <p className="mt-1 text-sm text-gray-500">
        Visualisez à partir de quel niveau de prix et de fréquentation un concert devient rentable.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-4">
        {champ(cachetArtiste, setCachetArtiste, 'Cachet artiste (€)')}
        {champ(coutsFixesAutres, setCoutsFixesAutres, 'Autres coûts fixes (€)')}
        {champ(commissionPct, setCommissionPct, 'Commission (%)', 0.5)}
        {champ(coutVariable, setCoutVariable, 'Coût variable / spectateur (€)', 0.5)}
        {champ(prixCentral, setPrixCentral, 'Prix billet central (€)', 0.5)}
        {champ(pasPrix, setPasPrix, 'Pas entre les prix (€)', 0.5)}
        {champ(spectateursCentral, setSpectateursCentral, 'Spectateurs central')}
        {champ(pasSpectateurs, setPasSpectateurs, 'Pas entre les lignes')}
      </div>

      {/* Heatmap */}
      <div className="mt-6 overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-dark">
          Carte thermique — Résultat opérationnel (lignes = spectateurs, colonnes = prix du billet)
        </h2>
        <table className="mt-4 w-full text-center text-xs">
          <thead>
            <tr>
              <th className="p-2 text-gray-400">Spectateurs \ Prix</th>
              {prix.map((p) => (
                <th key={p} className="p-2 text-gray-500">{p} €</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spectateurs.map((s) => (
              <tr key={s}>
                <td className="p-2 font-medium text-gray-500">{s}</td>
                {prix.map((p) => {
                  const r = resultatCase(p, s);
                  return (
                    <td key={p} className={`p-2 font-medium rounded ${couleurCase(r)}`}>
                      {formaterMontant(r)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graphique point mort classique */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-dark">
          Point mort classique (au prix de {prixCentral} €)
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={donneesCourbe}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="spectateurs" tick={{ fontSize: 12 }} label={{ value: 'Spectateurs', position: 'insideBottom', offset: -5, fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formaterMontant(v)} />
              <ReferenceLine y={0} stroke="#E5484D" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="resultat" stroke="#1E2A47" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
