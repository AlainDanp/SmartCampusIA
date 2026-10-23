import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, RetardBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';

export default function MesDemandes() {
  const [tickets, setTickets] = useState(null);
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setTickets(null);
    setErreur('');
    api(`/tickets/mine${statut ? `?statut=${statut}` : ''}`)
      .then(setTickets)
      .catch((e) => setErreur(e.message));
  }, [statut]);

  return (
    <div>
      <PageHeader
        eyebrow="Espace étudiant"
        title="Mes demandes"
        description="Retrouvez l’avancement de vos signalements et les dernières interventions."
        actions={<Link className="button primary" to="/signaler"><Icon name="add" size={17} />Nouveau signalement</Link>}
      />
      <section className="card data-card" aria-busy={!tickets && !erreur}>
        <div className="section-toolbar">
          <div>
            <h2>Suivi des signalements</h2>
            <p className="muted small">Filtrez les demandes selon leur état d’avancement.</p>
          </div>
          <div className="filters" role="group" aria-label="Filtrer par statut">
            {['', ...Object.keys(STATUTS)].map((s) => (
              <button
                key={s || 'tous'}
                type="button"
                className={`chip ${statut === s ? 'active' : ''}`}
                aria-pressed={statut === s}
                onClick={() => setStatut(s)}
              >
                {s ? STATUTS[s] : 'Tous'}
              </button>
            ))}
          </div>
        </div>
        {erreur && <p className="error" role="alert">{erreur}</p>}
        {!tickets && !erreur && <p className="loading-state" role="status">Chargement de vos demandes…</p>}
        {tickets?.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true"><Icon name="tickets" /></span>
            <h3>Aucune demande à afficher</h3>
            <p>Vous n’avez pas encore créé de signalement dans cette catégorie.</p>
            <Link className="button primary" to="/signaler">Signaler un incident</Link>
          </div>
        )}
        {tickets?.length > 0 && (
          <table>
            <caption className="visually-hidden">Liste de vos signalements</caption>
            <thead><tr><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Dernière mise à jour</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td data-label="N°"><Link className="ticket-link" to={`/tickets/${t.id}`}>{t.numero}</Link></td>
                  <td data-label="Incident"><strong>{t.categorie}</strong><div className="muted small truncate">{t.description}</div></td>
                  <td data-label="Lieu">{t.lieu}</td>
                  <td data-label="Statut"><StatutBadge statut={t.statut} /> <RetardBadge enRetard={t.enRetard} /></td>
                  <td data-label="Dernière mise à jour">{formatDate(t.dateMaj)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
