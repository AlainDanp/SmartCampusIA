import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { StatutBadge, PrioriteBadge, RetardBadge } from '../components/Badges.jsx';

const SUIVANT = { NOUVEAU: 'EN_COURS', EN_COURS: 'RESOLU' }; // RG-07

// US-02 (détail + historique) et US-03 (mise à jour du statut par le technicien)
export default function DetailTicket({ user }) {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [erreur, setErreur] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [erreurMaj, setErreurMaj] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    api(`/tickets/${id}`).then(setTicket).catch((e) => setErreur(e.message));
  }, [id]);

  useEffect(charger, [charger]);

  // Photo récupérée avec le JWT (le bucket S3 n'est jamais public)
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
      setErreurMaj('Un commentaire est obligatoire pour passer le ticket à « Résolu »'); // RG-08
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

  if (erreur) return <div className="card narrow empty-state"><p className="form-error">{erreur}</p><Link className="btn btn-ghost" to="/">Retour à l'accueil</Link></div>;
  if (!ticket) return <div className="detail-grid"><div className="card skeleton tall" /><div className="card skeleton tall" /></div>;

  const peutModifier = (user.role === 'ADMIN' || ticket.technicienId === user.id) && SUIVANT[ticket.statut];

  return (
    <>
    <button className="back-link" onClick={() => window.history.back()}>← Retour</button>
    <div className="detail-grid">
      <div className="card">
        <div className="detail-head">
          <div>
            <span className="eyebrow mono">{ticket.numero}</span>
            <h1>{ticket.categorie}</h1>
            <p className="page-subtitle">{ticket.lieu}</p>
          </div>
          <div className="badges"><PrioriteBadge priorite={ticket.priorite} /><StatutBadge statut={ticket.statut} /><RetardBadge enRetard={ticket.enRetard} /></div>
        </div>
        <dl>
          <dt>Catégorie</dt><dd>{ticket.categorie}</dd>
          <dt>Lieu</dt><dd>{ticket.lieu}</dd>
          <dt>Description</dt><dd>{ticket.description}</dd>
          <dt>Signalé par</dt><dd>{ticket.auteur} — {formatDate(ticket.dateCreation)}</dd>
          <dt>Technicien</dt><dd>{ticket.technicien || 'Non assigné'}</dd>
          <dt>Dernière mise à jour</dt><dd>{formatDate(ticket.dateMaj)}</dd>
          {ticket.dateResolution && (<><dt>Résolu le</dt><dd>{formatDate(ticket.dateResolution)}</dd></>)}
        </dl>
        {photoUrl && <img className="photo" src={photoUrl} alt="Photo de l'incident" />}

        {peutModifier && (
          <form className="maj" onSubmit={changerStatut}>
            <h3>Passer à « {STATUTS[SUIVANT[ticket.statut]]} »</h3>
            <textarea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
              placeholder={SUIVANT[ticket.statut] === 'RESOLU' ? 'Commentaire obligatoire : intervention réalisée…' : 'Commentaire (facultatif)'} />
            {erreurMaj && <p className="form-error">{erreurMaj}</p>}
            <button className="btn btn-primary" disabled={envoi}>{envoi ? <span className="spinner" /> : 'Valider'}</button>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Historique</h2>
        <ol className="timeline">
          {ticket.historique.map((h) => (
            <li key={h.id}>
              <div className="row between">
                <StatutBadge statut={h.nouveauStatut} />
                <span className="muted small">{formatDate(h.date)}</span>
              </div>
              <div className="small">par {h.auteur}</div>
              {h.commentaire && <p className="comment">{h.commentaire}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
    </>
  );
}
