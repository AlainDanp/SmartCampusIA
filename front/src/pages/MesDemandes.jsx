import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, RetardBadge } from '../components/Badges.jsx';

// US-02 : liste des tickets de l'étudiant connecté
export default function MesDemandes() {
  const [tickets, setTickets] = useState(null);
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setTickets(null);
    api(`/tickets/mine${statut ? `?statut=${statut}` : ''}`).then(setTickets).catch((e) => setErreur(e.message));
  }, [statut]);

  return (
    <div className="card">
      <div className="row between">
        <h1>Mes demandes</h1>
        <Link className="button primary" to="/signaler">+ Signaler</Link>
      </div>
      <div className="filters">
        {['', ...Object.keys(STATUTS)].map((s) => (
          <button key={s || 'tous'} className={`chip ${statut === s ? 'active' : ''}`} onClick={() => setStatut(s)}>
            {s ? STATUTS[s] : 'Tous'}
          </button>
        ))}
      </div>

      {erreur && <p className="error">{erreur}</p>}
      {!tickets && !erreur && <p className="muted">Chargement…</p>}
      {tickets && tickets.length === 0 && <p className="muted">Aucune demande pour l'instant.</p>}
      {tickets && tickets.length > 0 && (
        <table>
          <thead>
            <tr><th>N°</th><th>Incident</th><th>Lieu</th><th>Statut</th><th>Mis à jour</th></tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td><Link to={`/tickets/${t.id}`}>{t.numero}</Link></td>
                <td>{t.categorie}<div className="muted small">{t.description}</div></td>
                <td>{t.lieu}</td>
                <td><StatutBadge statut={t.statut} /> <RetardBadge enRetard={t.enRetard} /></td>
                <td>{formatDate(t.dateMaj)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
