export interface Salle {
  id: string;
  nom: string;
  adresse: string | null;
  capacite: number;
}

export interface Artiste {
  id: string;
  nom: string;
  genre_musical: string | null;
  contact: string | null;
}

export interface Saison {
  id: string;
  nom: string;
  date_debut: string | null;
  date_fin: string | null;
}

export interface Concert {
  id: string;
  date: string;
  salle_id: string | null;
  artiste_id: string | null;
  saison_id: string | null;
  genre_musical: string | null;
  prix_billet: number;
  billets_vendus: number;
  invitations: number;
  places_vip: number;
  commission_billetterie_pct: number;
  statut: 'planifie' | 'realise' | 'annule';
}

export interface Revenu {
  id: string;
  concert_id: string;
  type: string;
  montant: number;
}

export interface DepenseOperationnelle {
  id: string;
  concert_id: string;
  categorie: string;
  montant: number;
}
