import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { StatutBadge, PrioriteBadge, RetardBadge, PageHeader } from '../components/Badges.jsx';
import { Check } from '../components/Icons.jsx';

// US-03 : file du technicien (ou de l'admin), triée par priorité puis ancienneté
export default function MaFile({ user }) {
  const [tickets, setTickets] = useState(null);
  const [tous, setTous] = useState(false);
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();
  const admin = user.role === 'ADMIN';

  useEffect(() => {
    setTickets(null);
    api(`/tickets/assigned${tous ? '?tous=1' : ''}`).then(setTickets).catch((e) => setErreur(e.message));
  }, [tous]);

  return (
    <>
      <PageHeader
        titre={admin ? 'Tous les tickets' : 'Ma file'}
        sousTitre={admin ? 'Ensemble des incidents du campus, triés par priorité.' : 'Vos tickets assignés, les plus urgents en premier.'}
      >
        <label className="switch">
          <input type="checkbox" checked={tous} onChange={(e) => setTous(e.target.checked)} />
          <span className="switch-track"><span className="switch-thumb" /></span>
          Inclure les résolus
        </label>
      </PageHeader>

      <div className="card table-card">
        {erreur && <p className="form-error">{erreur}</p>}
        {!tickets && !erreur && <div className="skeleton-rows">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton line" />)}</div>}
        {tickets && tickets.length === 0 && (
          <div className="empty-state"><Check size={28} /><p>Aucun ticket à traiter. Beau travail !</p></div>
        )}
        {tickets && tickets.length > 0 && (
          <table>
            <thead>
              <tr><th>Priorité</th><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Créé le</th>{admin && <th>Technicien</th>}</tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className={`clickable ${t.priorite === 'CRITIQUE' ? 'critique' : ''}`} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td><PrioriteBadge priorite={t.priorite} /></td>
                  <td><Link to={`/tickets/${t.id}`} className="mono" onClick={(e) => e.stopPropagation()}>{t.numero}</Link></td>
                  <td><b className="cell-title">{t.categorie}</b><div className="muted small">{t.description}</div></td>
                  <td>{t.lieu}</td>
                  <td><div className="badges"><StatutBadge statut={t.statut} /><RetardBadge enRetard={t.enRetard} /></div></td>
                  <td className="muted">{formatDate(t.dateCreation)}</td>
                  {admin && <td>{t.technicien || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
