import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';

const MAX_MB = 5; // doit correspondre à MAX_PHOTO_MB côté API (RG-02)

// US-01 (et US-05 : arrivée depuis l'assistant avec une suggestion pré-remplie)
export default function Signaler() {
  const { state } = useLocation();
  const suggestion = state?.suggestion;

  const [refs, setRefs] = useState({ categories: [], lieux: [] });
  const [form, setForm] = useState({
    categorieId: suggestion?.categorieId ?? '',
    lieuId: suggestion?.lieuId ?? '',
    description: suggestion?.description ?? '',
  });
  const [photo, setPhoto] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [cree, setCree] = useState(null);

  useEffect(() => {
    api('/referentiels').then(setRefs).catch((e) => setErreurGlobale(e.message));
  }, []);

  const maj = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

  function verifier() {
    const e = {};
    if (!form.categorieId) e.categorieId = 'La catégorie est obligatoire';
    if (!form.lieuId) e.lieuId = 'Le lieu est obligatoire';
    if (!form.description.trim()) e.description = 'La description est obligatoire';
    if (photo && !['image/jpeg', 'image/png'].includes(photo.type)) e.photo = 'La photo doit être au format JPG ou PNG';
    if (photo && photo.size > MAX_MB * 1024 * 1024) e.photo = `La photo dépasse ${MAX_MB} Mo`;
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
        // US-05 : le numéro apparaît aussi dans la conversation
        try {
          const chat = JSON.parse(sessionStorage.getItem('sc_chat') || '[]');
          chat.push({ role: 'assistant', texte: `Votre signalement ${ticket.numero} a bien été créé. Vous pouvez le suivre dans « Mes demandes ».` });
          sessionStorage.setItem('sc_chat', JSON.stringify(chat));
        } catch { /* ignore */ }
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
      <div className="card narrow center">
        <h2>Signalement enregistré</h2>
        <p className="big">{cree.numero}</p>
        <p>Statut : <b>Nouveau</b>. Vous serez informé(e) de chaque changement dans « Mes demandes ».</p>
        <div className="actions">
          <Link className="button primary" to={`/tickets/${cree.id}`}>Voir le ticket</Link>
          {state?.fromAssistant
            ? <Link className="button" to="/assistant">Retour à l'assistant</Link>
            : <button onClick={() => { setCree(null); setForm({ categorieId: '', lieuId: '', description: '' }); setPhoto(null); }}>Nouveau signalement</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="card narrow">
      <h1>Signaler un incident</h1>
      {suggestion && <p className="info">Formulaire pré-rempli par l'assistant : vérifiez et corrigez chaque champ avant de valider.</p>}
      <form onSubmit={soumettre} noValidate>
        <label className={erreurs.categorieId ? 'invalid' : ''}>
          Catégorie *
          <select value={form.categorieId} onChange={maj('categorieId')}>
            <option value="">— Choisir —</option>
            {refs.categories.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
          </select>
          {erreurs.categorieId && <span className="error">{erreurs.categorieId}</span>}
        </label>

        <label className={erreurs.lieuId ? 'invalid' : ''}>
          Lieu *
          <select value={form.lieuId} onChange={maj('lieuId')}>
            <option value="">— Choisir —</option>
            {refs.lieux.map((l) => <option key={l.id} value={l.id}>{l.batiment} · {l.salle}</option>)}
          </select>
          {erreurs.lieuId && <span className="error">{erreurs.lieuId}</span>}
        </label>

        <label className={erreurs.description ? 'invalid' : ''}>
          Description *
          <textarea rows={4} value={form.description} onChange={maj('description')}
            placeholder="Ex. : le vidéoprojecteur ne s'allume pas" />
          {erreurs.description && <span className="error">{erreurs.description}</span>}
        </label>

        <label className={erreurs.photo ? 'invalid' : ''}>
          Photo (JPG ou PNG, {MAX_MB} Mo max)
          <input type="file" accept="image/jpeg,image/png" capture="environment"
            onChange={(e) => setPhoto(e.target.files[0] || null)} />
          {erreurs.photo && <span className="error">{erreurs.photo}</span>}
        </label>

        {erreurGlobale && <p className="error">{erreurGlobale}</p>}
        <button className="primary" disabled={envoi}>{envoi ? 'Envoi…' : 'Envoyer le signalement'}</button>
      </form>
    </div>
  );
}
