export interface ParametresSimulation {
  prixBillet: number;
  spectateurs: number;
  cachetArtiste: number;
  commissionPct: number;
  coutsFixesAutres: number; // assurance, techniciens, sécurité, etc. réunis
  coutVariableParSpectateur: number; // ex: catering par personne
  nombreAnnuelConcerts: number;
}

export interface ResultatSimulation {
  caBrut: number;
  commission: number;
  caNet: number;
  coutsVariablesTotal: number;
  coutsFixesTotal: number;
  coutsTotal: number;
  resultat: number;
  marge: number; // %
  seuilRentabiliteSpectateurs: number | null; // point mort en nombre de spectateurs
  resultatAnnuelEstime: number;
}

/**
 * Calcule le résultat prévisionnel d'un concert simulé, et son point mort
 * (le nombre de spectateurs à partir duquel le concert devient rentable).
 */
export function calculerSimulation(p: ParametresSimulation): ResultatSimulation {
  const caBrut = p.prixBillet * p.spectateurs;
  const commission = caBrut * (p.commissionPct / 100);
  const caNet = caBrut - commission;
  const coutsVariablesTotal = p.coutVariableParSpectateur * p.spectateurs;
  const coutsFixesTotal = p.cachetArtiste + p.coutsFixesAutres;
  const coutsTotal = coutsFixesTotal + coutsVariablesTotal;
  const resultat = caNet - coutsTotal;
  const marge = caNet > 0 ? (resultat / caNet) * 100 : 0;

  const prixNetParSpectateur = p.prixBillet * (1 - p.commissionPct / 100) - p.coutVariableParSpectateur;
  const seuilRentabiliteSpectateurs =
    prixNetParSpectateur > 0 ? Math.ceil(coutsFixesTotal / prixNetParSpectateur) : null;

  const resultatAnnuelEstime = resultat * p.nombreAnnuelConcerts;

  return {
    caBrut,
    commission,
    caNet,
    coutsVariablesTotal,
    coutsFixesTotal,
    coutsTotal,
    resultat,
    marge,
    seuilRentabiliteSpectateurs,
    resultatAnnuelEstime,
  };
}

export type ScenarioNom =
  | 'pessimiste'
  | 'normal'
  | 'optimiste'
  | 'salle_complete'
  | 'festival'
  | 'gratuit';

/**
 * Applique un scénario prédéfini à des paramètres de base, en renvoyant
 * une nouvelle version modifiée (sans toucher aux paramètres d'origine).
 */
export function appliquerScenario(
  base: ParametresSimulation,
  scenario: ScenarioNom,
  capaciteSalle?: number
): ParametresSimulation {
  switch (scenario) {
    case 'pessimiste':
      return { ...base, spectateurs: Math.round(base.spectateurs * 0.7) };
    case 'normal':
      return { ...base };
    case 'optimiste':
      return { ...base, spectateurs: Math.round(base.spectateurs * 1.3) };
    case 'salle_complete':
      return { ...base, spectateurs: capaciteSalle ?? base.spectateurs };
    case 'festival':
      return {
        ...base,
        cachetArtiste: Math.round(base.cachetArtiste * 1.8),
        commissionPct: 0,
        spectateurs: capaciteSalle ? capaciteSalle : Math.round(base.spectateurs * 1.5),
      };
    case 'gratuit':
      return { ...base, prixBillet: 0 };
    default:
      return { ...base };
  }
}

export function formaterMontant(montant: number): string {
  return montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
