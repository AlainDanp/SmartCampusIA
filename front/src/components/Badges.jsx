import { STATUTS, PRIORITES } from '../api.js';

export function StatutBadge({ statut }) {
  return <span className={`badge statut-${statut}`}>{STATUTS[statut] || statut}</span>;
}

// RG-06 : ticket « Nouveau » depuis plus de 24 h
export function RetardBadge({ enRetard }) {
  return enRetard ? <span className="badge retard">En retard</span> : null;
}

export function PrioriteBadge({ priorite }) {
  return <span className={`badge prio-${priorite}`}>{PRIORITES[priorite] || priorite}</span>;
}
