import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, PrioriteBadge, RetardBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';

const SUIVANT = { NOUVEAU: 'EN_COURS', EN_COURS: 'RESOLU' };

export default function DetailTicket({ user }) {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [erreur, setErreur] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [erreurMaj, setErreurMaj] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    setErreur('');
    api(`/tickets/${id}`).then(setTicket).catch((e) => setErreur(e.message));
  }, [id]);

  useEffect(charger, [charger]);
  useEffect(() => {
    if (!ticket?.aPhoto) return undefined;
    let url;
    api(`/tickets/${id}/photo`).then((blob) => { url = URL.createObjectURL(blob); setPhotoUrl(url); }).catch(() => {});
    return () => url && URL.revokeObjectURL(url);
  }, [ticket?.aPhoto, id]);

  async function changerStatut(e) {
    e.preventDefault();
    const statut = SUIVANT[ticket.statut];
    setErreurMaj('');
    if (statut === 'RESOLU' && !commentaire.trim()) {
      setErreurMaj('Un commentaire est requis pour clôturer ce ticket.');
      return;
    }
    setEnvoi(true);
    try {
      await api(`/tickets/${id}/status`, { method: 'PATCH', body: { statut, commentaire } });
      setCommentaire('');
      charger();
    } catch (err) {
      setErreurMaj(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  if (erreur) return <div className="card narrow"><p className="error" role="alert">{erreur}</p><Link className="button" to="/">Retour à l’accueil</Link></div>;
  if (!ticket) return <p className="loading-state" role="status">Chargement du ticket…</p>;

  const peutModifier = (user.role === 'ADMIN' || ticket.technicienId === user.id) && SUIVANT[ticket.statut];
  const commentaireRequis = SUIVANT[ticket.statut] === 'RESOLU';

  return (
    <div>
      <PageHeader eyebrow="Suivi d’incident" title={ticket.numero} description={`${ticket.categorie} · ${ticket.lieu}`} actions={<Link className="button" to={user.role === 'ETUDIANT' ? '/mes-demandes' : '/ma-file'}>Retour à la liste</Link>} />
      <div className="ticket-status-bar">
        <div><PrioriteBadge priorite={ticket.priorite} /><StatutBadge statut={ticket.statut} /><RetardBadge enRetard={ticket.enRetard} /></div>
        <span>Dernière mise à jour : {formatDate(ticket.dateMaj)}</span>
      </div>
      <div className="ticket-layout">
        <section className="card ticket-main">
          <div className="section-title"><div><p className="eyebrow">Description</p><h2>Informations sur l’incident</h2></div></div>
          <p className="ticket-description">{ticket.description}</p>
          <div className="metadata-grid">
            <div><span>Catégorie</span><strong>{ticket.categorie}</strong></div>
            <div><span>Lieu</span><strong>{ticket.lieu}</strong></div>
            <div><span>Signalé par</span><strong>{ticket.auteur}</strong><small>{formatDate(ticket.dateCreation)}</small></div>
            <div><span>Technicien référent</span><strong>{ticket.technicien || 'Non assigné'}</strong></div>
            {ticket.dateResolution && <div><span>Résolu le</span><strong>{formatDate(ticket.dateResolution)}</strong></div>}
          </div>
          {photoUrl && <div className="incident-photo"><img src={photoUrl} alt="Photo jointe au signalement" /></div>}
          {peutModifier && (
            <form className="transition-panel" onSubmit={changerStatut}>
              <p className="eyebrow">Action d’intervention</p>
              <h3>Passer à « {STATUTS[SUIVANT[ticket.statut]]} »</h3>
              <label htmlFor="commentaire-intervention">
                Commentaire {commentaireRequis ? <span className="required-copy">requis</span> : <span className="optional">facultatif</span>}
                <textarea id="commentaire-intervention" rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} required={commentaireRequis} aria-invalid={Boolean(erreurMaj)} aria-describedby={erreurMaj ? 'commentaire-error' : undefined} placeholder={commentaireRequis ? 'Décrivez l’intervention réalisée…' : 'Ajoutez un commentaire pour le demandeur…'} />
              </label>
              {erreurMaj && <p className="error" id="commentaire-error" role="alert">{erreurMaj}</p>}
              <button className="primary" disabled={envoi}>{envoi ? 'Mise à jour…' : 'Valider la mise à jour'}</button>
            </form>
          )}
        </section>
        <aside className="card history-card">
          <p className="eyebrow">Traçabilité</p>
          <h2>Historique</h2>
          <ol className="timeline">
            {ticket.historique.map((h) => (
              <li key={h.id}>
                <div className="timeline-head"><StatutBadge statut={h.nouveauStatut} /><time>{formatDate(h.date)}</time></div>
                <div className="timeline-author">par {h.auteur}</div>
                {h.commentaire && <p className="comment">{h.commentaire}</p>}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
