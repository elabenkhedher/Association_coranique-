// ============================================================
// Types & Interfaces – Association Coranique
// ============================================================

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: "admin" | "enseignant" | "apprenant" | "parent";
  telephone?: string;
  centre_id?: number;
  is_active?: boolean;
  date_joined?: string;
}

export interface Centre {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
  telephone?: string;
  email?: string;
  responsable?: number;
  nombre_apprenants?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Planning {
  id: number;
  titre?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  enseignant: number;
  enseignant_nom?: string;
  centre?: number;
  centre_nom?: string;
  programme?: number;
  programme_titre?: string;
  est_annule: boolean;
  createur?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Presence {
  id: number;
  creneau_id: number;
  apprenant_id: number;
  apprenant_nom?: string;
  date: string;
  statut: "present" | "absent" | "retard" | "justifie";
  commentaire?: string;
  created_at?: string;
}

export interface SeanceLecture {
  id: number;
  apprenant_id: number;
  apprenant_nom?: string;
  enseignant_id: number;
  enseignant_nom?: string;
  date: string;
  sourate: string;
  verset_debut: number;
  verset_fin: number;
  note?: number;
  observations?: string;
  type_lecture?: "revision" | "memorisation" | "recitation";
  created_at?: string;
}

export interface Conversation {
  id: number;
  participants: User[];
  dernier_message?: string;
  dernier_message_date?: string;
  non_lu?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  expediteur_id: number;
  expediteur_nom?: string;
  contenu: string;
  lu?: boolean;
  created_at?: string;
}

export interface StatistiquesGlobal {
  nombre_centres: number;
  nombre_enseignants: number;
  nombre_apprenants: number;
  nombre_seances_lecture: number;
  nombre_creneaux: number;
  creneaux_annules?: number;
  taux_presence?: number; // Calculé ou optionnel
}

export interface CentreStatistiques {
  centre?: string;
  nombre_enseignants: number;
  nombre_apprenants: number;
  nombre_creneaux: number;
  nombre_seances: number;
  taux_presence: number;
  evaluation_moyenne?: number;
}

// ---- Types utilitaires ----

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PlanningFilters {
  centre_id?: number;
  enseignant_id?: number;
  jour?: string;
  date_debut?: string;
  date_fin?: string;
}
