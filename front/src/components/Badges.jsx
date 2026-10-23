import { STATUTS, PRIORITES } from '../api.js';

export function StatutBadge({ statut }) {
  return <span className={`badge statut-${statut}`}><i />{STATUTS[statut] || statut}</span>;
}

// RG-06 : ticket « Nouveau » depuis plus de 24 h
export function RetardBadge({ enRetard }) {
  return enRetard ? <span className="badge retard"><i />En retard</span> : null;
}

export function PrioriteBadge({ priorite }) {
  return <span className={`badge prio-${priorite}`}><i />{PRIORITES[priorite] || priorite}</span>;
}

// En-tête de page commun
export function PageHeader({ titre, sousTitre, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{titre}</h1>
        {sousTitre && <p className="page-subtitle">{sousTitre}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
