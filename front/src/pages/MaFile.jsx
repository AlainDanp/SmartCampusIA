import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { StatutBadge, PrioriteBadge, RetardBadge } from '../components/Badges.jsx';

// US-03 : file du technicien (ou de l'admin), triée par priorité puis ancienneté
export default function MaFile({ user }) {
  const [tickets, setTickets] = useState(null);
  const [tous, setTous] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setTickets(null);
    api(`/tickets/assigned${tous ? '?tous=1' : ''}`).then(setTickets).catch((e) => setErreur(e.message));
  }, [tous]);

  return (
    <div className="card">
      <div className="row between">
        <h1>{user.role === 'ADMIN' ? 'Tous les tickets' : 'Ma file'}</h1>
        <label className="inline">
          <input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} /> Inclure les résolus
        </label>
      </div>
      {erreur && <p className="error">{erreur}</p>}
      {!tickets && !erreur && <p className="muted">Chargement…</p>}
      {tickets && tickets.length === 0 && <p className="muted">Aucun ticket à traiter.</p>}
      {tickets && tickets.length > 0 && (
        <table>
          <thead>
            <tr><th>Priorité</th><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Créé le</th>{user.role === 'ADMIN' && <th>Technicien</th>}</tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className={t.priorite === 'CRITIQUE' ? 'critique' : ''}>
                <td><PrioriteBadge priorite={t.priorite} /></td>
                <td><Link to={`/tickets/${t.id}`}>{t.numero}</Link></td>
                <td>{t.categorie}<div className="muted small">{t.description}</div></td>
                <td>{t.lieu}</td>
                <td><StatutBadge statut={t.statut} /> <RetardBadge enRetard={t.enRetard} /></td>
                <td>{formatDate(t.dateCreation)}</td>
                {user.role === 'ADMIN' && <td>{t.technicien || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
