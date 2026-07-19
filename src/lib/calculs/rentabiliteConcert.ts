import { Concert, Revenu, DepenseOperationnelle } from '@/lib/types';

export interface ResultatConcert {
  caBrutBilletterie: number;
  commissionBilletterie: number;
  caNetBilletterie: number;
  autresRevenus: number;
  revenuTotal: number;
  coutsOperationnels: number;
  resultatOperationnel: number;
  marge: number; // en %
  nbSpectateursTotal: number;
  tauxRemplissage: number; // en %
  statutRentabilite: 'rentable' | 'equilibre' | 'perte';
}

/**
 * Calcule tous les indicateurs financiers d'un concert.
 * C'est la seule fonction qui applique la formule du cahier des charges :
 * Résultat opérationnel = Revenus du concert - Coûts opérationnels
 */
export function calculerResultatConcert(
  concert: Concert,
  revenus: Revenu[],
  depenses: DepenseOperationnelle[],
  capaciteSalle: number
): ResultatConcert {
  const caBrutBilletterie = concert.prix_billet * concert.billets_vendus;
  const commissionBilletterie = caBrutBilletterie * (concert.commission_billetterie_pct / 100);
  const caNetBilletterie = caBrutBilletterie - commissionBilletterie;

  const autresRevenus = revenus.reduce((total, r) => total + r.montant, 0);
  const revenuTotal = caNetBilletterie + autresRevenus;

  const coutsOperationnels = depenses.reduce((total, d) => total + d.montant, 0);

  const resultatOperationnel = revenuTotal - coutsOperationnels;
  const marge = revenuTotal > 0 ? (resultatOperationnel / revenuTotal) * 100 : 0;

  const nbSpectateursTotal = concert.billets_vendus + concert.invitations + concert.places_vip;
  const tauxRemplissage = capaciteSalle > 0 ? (nbSpectateursTotal / capaciteSalle) * 100 : 0;

  let statutRentabilite: ResultatConcert['statutRentabilite'] = 'perte';
  if (resultatOperationnel > 0) statutRentabilite = 'rentable';
  else if (resultatOperationnel === 0) statutRentabilite = 'equilibre';

  return {
    caBrutBilletterie,
    commissionBilletterie,
    caNetBilletterie,
    autresRevenus,
    revenuTotal,
    coutsOperationnels,
    resultatOperationnel,
    marge,
    nbSpectateursTotal,
    tauxRemplissage,
    statutRentabilite,
  };
}

export function formaterMontant(montant: number): string {
  return montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
