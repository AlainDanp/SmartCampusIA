import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, RetardBadge, PageHeader } from '../components/Badges.jsx';
import { Plus, Ticket } from '../components/Icons.jsx';
import { marquerVus, ticketsModifies } from '../notifications.js';

// US-02 : liste des tickets de l'étudiant connecté
export default function MesDemandes({ user }) {
  const [tickets, setTickets] = useState(null);
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');
  const [misAJour, setMisAJour] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    setTickets(null);
    api(`/tickets/mine${statut ? `?statut=${statut}` : ''}`)
      .then((liste) => {
        // Notifications : on repère les tickets modifiés depuis la dernière visite, puis on les marque comme vus
        const modifies = ticketsModifies(user, liste).map((t) => t.id);
        setMisAJour((prec) => new Set([...prec, ...modifies]));
        marquerVus(user, liste);
        setTickets(liste);
      })
      .catch((e) => setErreur(e.message));
  }, [statut, user]);

  return (
    <>
      <PageHeader
        titre="Mes demandes"
        sousTitre={misAJour.size > 0
          ? `${misAJour.size} demande${misAJour.size > 1 ? 's ont' : ' a'} changé de statut depuis votre dernière visite.`
          : "Suivez l'avancement de vos signalements."}
      >
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
                <tr key={t.id} className={`clickable ${misAJour.has(t.id) ? 'updated' : ''}`} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td><Link to={`/tickets/${t.id}`} className="mono" onClick={(e) => e.stopPropagation()}>{t.numero}</Link></td>
                  <td><b className="cell-title">{t.categorie}</b><div className="muted small">{t.description}</div></td>
                  <td>{t.lieu}</td>
                  <td><div className="badges"><StatutBadge statut={t.statut} /><RetardBadge enRetard={t.enRetard} />{misAJour.has(t.id) && <span className="badge maj-badge"><i />Mis à jour</span>}</div></td>
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
