import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, RetardBadge, PageHeader } from '../components/Badges.jsx';
import { Plus, Ticket } from '../components/Icons.jsx';

// US-02 : liste des tickets de l'étudiant connecté
export default function MesDemandes() {
  const [tickets, setTickets] = useState(null);
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setTickets(null);
    api(`/tickets/mine${statut ? `?statut=${statut}` : ''}`).then(setTickets).catch((e) => setErreur(e.message));
  }, [statut]);

  return (
    <>
      <PageHeader titre="Mes demandes" sousTitre="Suivez l'avancement de vos signalements.">
        <Link className="btn btn-primary" to="/signaler"><Plus size={16} /> Nouveau signalement</Link>
      </PageHeader>

      <div className="card table-card">
        <div className="filters">
          {['', ...Object.keys(STATUTS)].map((s) => (
            <button key={s || 'tous'} className={`chip ${statut === s ? 'active' : ''}`} onClick={() => setStatut(s)}>
              {s ? STATUTS[s] : 'Tous'}
            </button>
          ))}
        </div>

        {erreur && <p className="form-error">{erreur}</p>}
        {!tickets && !erreur && <div className="skeleton-rows">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton line" />)}</div>}
        {tickets && tickets.length === 0 && (
          <div className="empty-state">
            <Ticket size={28} />
            <p>Aucune demande pour l'instant.</p>
            <Link className="btn btn-ghost" to="/signaler">Signaler un incident</Link>
          </div>
        )}
        {tickets && tickets.length > 0 && (
          <table>
            <thead>
              <tr><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Mis à jour</th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td><Link to={`/tickets/${t.id}`} className="mono" onClick={(e) => e.stopPropagation()}>{t.numero}</Link></td>
                  <td><b className="cell-title">{t.categorie}</b><div className="muted small">{t.description}</div></td>
                  <td>{t.lieu}</td>
                  <td><div className="badges"><StatutBadge statut={t.statut} /><RetardBadge enRetard={t.enRetard} /></div></td>
                  <td className="muted">{formatDate(t.dateMaj)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
