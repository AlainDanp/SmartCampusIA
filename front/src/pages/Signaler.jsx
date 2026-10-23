import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';

const MAX_MB = 5;

export default function Signaler() {
  const { state } = useLocation();
  const suggestion = state?.suggestion;
  const successRef = useRef(null);
  const [refs, setRefs] = useState({ categories: [], lieux: [] });
  const [form, setForm] = useState({ categorieId: suggestion?.categorieId ?? '', lieuId: suggestion?.lieuId ?? '', description: suggestion?.description ?? '' });
  const [photo, setPhoto] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [cree, setCree] = useState(null);

  useEffect(() => { api('/referentiels').then(setRefs).catch((e) => setErreurGlobale(e.message)); }, []);
  useEffect(() => { if (cree) successRef.current?.focus(); }, [cree]);

  const maj = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

  function verifier() {
    const e = {};
    if (!form.categorieId) e.categorieId = 'Choisissez une catégorie.';
    if (!form.lieuId) e.lieuId = 'Indiquez le lieu concerné.';
    if (!form.description.trim()) e.description = 'Décrivez l’incident rencontré.';
    if (photo && !['image/jpeg', 'image/png'].includes(photo.type)) e.photo = 'Ajoutez une image au format JPG ou PNG.';
    if (photo && photo.size > MAX_MB * 1024 * 1024) e.photo = `La photo dépasse ${MAX_MB} Mo.`;
    return e;
  }

  async function soumettre(ev) {
    ev.preventDefault();
    setErreurGlobale('');
    const e = verifier();
    setErreurs(e);
    if (Object.keys(e).length) return;

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (photo) data.append('photo', photo);

    setEnvoi(true);
    try {
      const ticket = await api('/tickets', { method: 'POST', form: data });
      setCree(ticket);
      if (state?.fromAssistant) {
        try {
          const chat = JSON.parse(sessionStorage.getItem('sc_chat') || '[]');
          chat.push({ role: 'assistant', texte: `Votre signalement ${ticket.numero} a bien été créé. Vous pouvez le suivre dans « Mes demandes ».` });
          sessionStorage.setItem('sc_chat', JSON.stringify(chat));
        } catch { /* stockage indisponible */ }
      }
    } catch (err) {
      setErreurs(err.data?.champs || {});
      setErreurGlobale(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  if (cree) {
    return (
      <div className="success-card card narrow center" role="status" tabIndex="-1" ref={successRef}>
        <span className="success-icon" aria-hidden="true"><Icon name="check" size={25} strokeWidth={2.2} /></span>
        <p className="eyebrow">Signalement enregistré</p>
        <h1>Merci pour votre vigilance</h1>
        <p className="ticket-number">{cree.numero}</p>
        <p className="muted">Votre demande a été transmise aux équipes concernées. Vous recevrez les mises à jour dans votre espace personnel.</p>
        <div className="actions">
          <Link className="button primary" to={`/tickets/${cree.id}`}>Suivre le ticket</Link>
          {state?.fromAssistant
            ? <Link className="button" to="/assistant">Retour à l’assistant</Link>
            : <button type="button" className="button" onClick={() => { setCree(null); setForm({ categorieId: '', lieuId: '', description: '' }); setPhoto(null); }}>Créer un autre signalement</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <PageHeader eyebrow="Espace étudiant" title="Signaler un incident" description="Quelques informations suffisent pour permettre aux équipes campus d’intervenir rapidement." />
      <div className="report-layout">
        <form className="card report-form" onSubmit={soumettre} noValidate>
          <h2>Informations sur l’incident</h2>
          {suggestion && <p className="info">L’assistant a pré-rempli ces informations. Vérifiez-les avant l’envoi.</p>}
          <div className="form-grid">
            <label className={erreurs.categorieId ? 'invalid' : ''} htmlFor="categorie">
              Catégorie <span aria-hidden="true">*</span>
              <select id="categorie" value={form.categorieId} onChange={maj('categorieId')} required aria-invalid={Boolean(erreurs.categorieId)} aria-describedby={erreurs.categorieId ? 'categorie-error' : undefined}>
                <option value="">Sélectionner une catégorie</option>
                {refs.categories.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
              {erreurs.categorieId && <span className="error" id="categorie-error">{erreurs.categorieId}</span>}
            </label>
            <label className={erreurs.lieuId ? 'invalid' : ''} htmlFor="lieu">
              Lieu <span aria-hidden="true">*</span>
              <select id="lieu" value={form.lieuId} onChange={maj('lieuId')} required aria-invalid={Boolean(erreurs.lieuId)} aria-describedby={erreurs.lieuId ? 'lieu-error' : undefined}>
                <option value="">Sélectionner un lieu</option>
                {refs.lieux.map((l) => <option key={l.id} value={l.id}>{l.batiment} · {l.salle}</option>)}
              </select>
              {erreurs.lieuId && <span className="error" id="lieu-error">{erreurs.lieuId}</span>}
            </label>
          </div>
          <label className={erreurs.description ? 'invalid' : ''} htmlFor="description">
            Décrivez le problème <span aria-hidden="true">*</span>
            <textarea id="description" rows={6} value={form.description} onChange={maj('description')} required placeholder="Ex. : le vidéoprojecteur de la salle ne s’allume plus, même après redémarrage." aria-invalid={Boolean(erreurs.description)} aria-describedby={erreurs.description ? 'description-error' : undefined} />
            {erreurs.description && <span className="error" id="description-error">{erreurs.description}</span>}
          </label>
          <label className={`upload-field ${erreurs.photo ? 'invalid' : ''}`} htmlFor="photo">
            Ajouter une photo <span className="optional">facultatif</span>
            <input id="photo" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(e) => setPhoto(e.target.files[0] || null)} aria-invalid={Boolean(erreurs.photo)} aria-describedby={`photo-help${erreurs.photo ? ' photo-error' : ''}`} />
            <span className="upload-help" id="photo-help">JPG ou PNG · {MAX_MB} Mo maximum {photo && `· ${photo.name}`}</span>
            {erreurs.photo && <span className="error" id="photo-error">{erreurs.photo}</span>}
          </label>
          {erreurGlobale && <p className="error" role="alert">{erreurGlobale}</p>}
          <button className="primary" disabled={envoi}>{envoi ? 'Envoi en cours…' : 'Envoyer le signalement'}</button>
        </form>
        <aside className="report-aside">
          <p className="eyebrow">Bon à savoir</p>
          <h2>Chaque signalement compte.</h2>
          <p>Un signalement précis aide nos équipes à prioriser et à intervenir au bon endroit.</p>
          <ol><li>Décrivez le problème observé.</li><li>Localisez-le avec précision.</li><li>Suivez son traitement depuis votre espace.</li></ol>
        </aside>
      </div>
    </div>
  );
}
