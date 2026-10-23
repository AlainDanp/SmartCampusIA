import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { StatutBadge, PrioriteBadge, RetardBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';

export default function MaFile({ user }) {
  const [tickets, setTickets] = useState(null);
  const [tous, setTous] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setTickets(null);
    setErreur('');
    api(`/tickets/assigned${tous ? '?tous=1' : ''}`)
      .then(setTickets)
      .catch((e) => setErreur(e.message));
  }, [tous]);

  const titre = user.role === 'ADMIN' ? 'Tous les tickets' : 'Ma file d’intervention';
  const description = user.role === 'ADMIN'
    ? 'Supervisez l’activité et les priorités de l’ensemble du campus.'
    : 'Organisez les interventions qui vous sont confiées par ordre de priorité.';

  return (
    <div>
      <PageHeader eyebrow={user.role === 'ADMIN' ? 'Administration' : 'Équipe technique'} title={titre} description={description} />
      <section className="card data-card" aria-busy={!tickets && !erreur}>
        <div className="section-toolbar">
          <div>
            <h2>Tickets à traiter</h2>
            <p className="muted small">Les incidents critiques et les plus anciens apparaissent en priorité.</p>
          </div>
          <label className="toggle-label">
            <input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} />
            <span>Inclure les résolus</span>
          </label>
        </div>
        {erreur && <p className="error" role="alert">{erreur}</p>}
        {!tickets && !erreur && <p className="loading-state" role="status">Chargement de la file d’intervention…</p>}
        {tickets?.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true"><Icon name="check" /></span>
            <h3>Aucun ticket à traiter</h3>
            <p>Votre file est vide pour le moment.</p>
          </div>
        )}
        {tickets?.length > 0 && (
          <table>
            <caption className="visually-hidden">File des tickets à traiter</caption>
            <thead><tr><th>Priorité</th><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Créé le</th>{user.role === 'ADMIN' && <th>Technicien</th>}</tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className={t.priorite === 'CRITIQUE' ? 'critique' : ''}>
                  <td data-label="Priorité"><PrioriteBadge priorite={t.priorite} /></td>
                  <td data-label="N°"><Link className="ticket-link" to={`/tickets/${t.id}`}>{t.numero}</Link></td>
                  <td data-label="Incident"><strong>{t.categorie}</strong><div className="muted small truncate">{t.description}</div></td>
                  <td data-label="Lieu">{t.lieu}</td>
                  <td data-label="Statut"><StatutBadge statut={t.statut} /> <RetardBadge enRetard={t.enRetard} /></td>
                  <td data-label="Créé le">{formatDate(t.dateCreation)}</td>
                  {user.role === 'ADMIN' && <td data-label="Technicien">{t.technicien || 'Non assigné'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
