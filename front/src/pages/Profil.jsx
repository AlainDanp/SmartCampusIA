import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { PageHeader } from '../components/Badges.jsx';
import { useCountUp } from '../components/Charts.jsx';
import { Mail, Lock, Eye, EyeOff, Check, Ticket, Wrench, Hourglass, Clock, Plus, Chat, Grid, Logout } from '../components/Icons.jsx';

const ROLE_LABEL = { ETUDIANT: 'Étudiant', TECHNICIEN: 'Technicien', ADMIN: 'Administration' };

const PERIMETRE = {
  ETUDIANT: { total: 'Mes signalements', nouveaux: 'En attente', enCours: 'En cours', resolus: 'Résolus' },
  TECHNICIEN: { total: 'Tickets assignés', nouveaux: 'À prendre en charge', enCours: 'En cours', resolus: 'Résolus' },
  ADMIN: { total: 'Tickets du campus', nouveaux: 'Nouveaux', enCours: 'En cours', resolus: 'Résolus' },
};

const initiales = (nom = '') => nom.split(' ').map((m) => m[0]).join('').slice(0, 2).toUpperCase();

function Stat({ icone: Icone, ton, libelle, valeur, suffixe = '', decimales = 0 }) {
  const anime = useCountUp(valeur ?? 0);
  return (
    <div className={`card kpi kpi-${ton}`}>
      <span className="kpi-icon"><Icone size={20} /></span>
      <span className="kpi-label">{libelle}</span>
      <b className="kpi-value">{valeur == null ? '—' : `${anime.toFixed(decimales).replace('.', ',')}${suffixe}`}</b>
    </div>
  );
}

// Robustesse indicative du mot de passe (0 à 4)
function robustesse(mdp) {
  let score = 0;
  if (mdp.length >= 8) score += 1;
  if (mdp.length >= 12) score += 1;
  if (/[A-Z]/.test(mdp) && /[a-z]/.test(mdp)) score += 1;
  if (/\d/.test(mdp) && /[^A-Za-z0-9]/.test(mdp)) score += 1;
  return score;
}
const NIVEAUX = ['Trop court', 'Faible', 'Correct', 'Bon', 'Excellent'];

function ChampMdp({ label, value, onChange, erreur, autoComplete }) {
  const [voir, setVoir] = useState(false);
  return (
    <label className={`field ${erreur ? 'invalid' : ''}`}>
      <span className="field-label">{label}</span>
      <span className="input-icon">
        <Lock />
        <input type={voir ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
        <button type="button" className="input-toggle" onClick={() => setVoir((v) => !v)} aria-label={voir ? 'Masquer' : 'Afficher'}>
          {voir ? <EyeOff /> : <Eye />}
        </button>
      </span>
      {erreur && <span className="error">{erreur}</span>}
    </label>
  );
}

export default function Profil({ user, onLogout }) {
  const [profil, setProfil] = useState(null);
  const [erreur, setErreur] = useState('');
  const [form, setForm] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [champs, setChamps] = useState({});
  const [message, setMessage] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api('/profil').then(setProfil).catch((e) => setErreur(e.message));
  }, []);

  const maj = (champ) => (v) => { setForm((f) => ({ ...f, [champ]: v })); setMessage(null); };
  const score = robustesse(form.nouveau);

  async function changerMotDePasse(e) {
    e.preventDefault();
    const err = {};
    if (!form.actuel) err.actuel = 'Obligatoire';
    if (form.nouveau.length < 8) err.nouveau = 'Au moins 8 caractères';
    if (form.confirmation !== form.nouveau) err.confirmation = 'Les mots de passe ne correspondent pas';
    setChamps(err);
    if (Object.keys(err).length) return;

    setEnvoi(true);
    try {
      await api('/profil/mot-de-passe', { method: 'PATCH', body: { actuel: form.actuel, nouveau: form.nouveau } });
      setForm({ actuel: '', nouveau: '', confirmation: '' });
      setMessage({ ok: true, texte: 'Mot de passe mis à jour.' });
    } catch (err2) {
      setChamps(err2.data?.champs || {});
      setMessage({ ok: false, texte: err2.message });
    } finally {
      setEnvoi(false);
    }
  }

  if (erreur) return <div className="card form-error">{erreur}</div>;

  const libelles = PERIMETRE[user.role];
  const s = profil?.stats;

  return (
    <>
      <PageHeader titre="Mon profil" sousTitre="Vos informations, votre activité et la sécurité de votre compte." />

      <section className={`card profile-hero hero-${user.role}`}>
        <span className={`avatar avatar-xl role-${user.role}`}>{initiales(profil?.nom || user.nom)}</span>
        <div className="profile-id">
          <h2>{profil?.nom || user.nom}</h2>
          <p className="profile-mail"><Mail size={15} /> {profil?.email || '…'}</p>
          <div className="badges">
            <span className="badge role-badge"><i />{ROLE_LABEL[user.role]}</span>
            {profil?.categories?.map((c) => <span key={c} className="badge prio-NORMALE"><i />{c}</span>)}
          </div>
        </div>
        <div className="profile-actions">
          {user.role === 'ETUDIANT' && (
            <>
              <Link className="btn btn-primary" to="/signaler"><Plus size={16} /> Signaler</Link>
              <Link className="btn" to="/assistant"><Chat size={16} /> Assistant</Link>
            </>
          )}
          {user.role === 'TECHNICIEN' && <Link className="btn btn-primary" to="/ma-file"><Wrench size={16} /> Ma file</Link>}
          {user.role === 'ADMIN' && <Link className="btn btn-primary" to="/dashboard"><Grid size={16} /> Tableau de bord</Link>}
        </div>
      </section>

      <h3 className="section-title">Activité</h3>
      {!s ? (
        <div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="card kpi skeleton" />)}</div>
      ) : (
        <div className="kpis">
          <Stat icone={Ticket} ton="accent" libelle={libelles.total} valeur={s.total} />
          <Stat icone={Hourglass} ton="blue" libelle={libelles.nouveaux} valeur={s.nouveaux} />
          <Stat icone={Wrench} ton="amber" libelle={libelles.enCours} valeur={s.enCours} />
          {user.role === 'ETUDIANT'
            ? <Stat icone={Check} ton="green" libelle={libelles.resolus} valeur={s.resolus} />
            : <Stat icone={Clock} ton="green" libelle="Délai moyen de résolution" valeur={s.delaiMoyenHeures} suffixe=" h" decimales={1} />}
        </div>
      )}

      <div className="profile-grid">
        <section className="card">
          <h2>Sécurité</h2>
          <p className="muted small">Choisissez un mot de passe d'au moins 8 caractères, que vous n'utilisez nulle part ailleurs.</p>
          <form onSubmit={changerMotDePasse} noValidate>
            <ChampMdp label="Mot de passe actuel" value={form.actuel} onChange={maj('actuel')} erreur={champs.actuel} autoComplete="current-password" />
            <ChampMdp label="Nouveau mot de passe" value={form.nouveau} onChange={maj('nouveau')} erreur={champs.nouveau} autoComplete="new-password" />
            {form.nouveau && (
              <div className="strength" data-score={score}>
                <div className="strength-bars">{[0, 1, 2, 3].map((i) => <span key={i} className={i < score ? 'on' : ''} />)}</div>
                <small>{NIVEAUX[score]}</small>
              </div>
            )}
            <ChampMdp label="Confirmer le nouveau mot de passe" value={form.confirmation} onChange={maj('confirmation')} erreur={champs.confirmation} autoComplete="new-password" />
            {message && <p className={message.ok ? 'form-success' : 'form-error'} role="status">{message.ok && <Check size={16} />} {message.texte}</p>}
            <button className="btn btn-primary" disabled={envoi}>{envoi ? <span className="spinner" /> : 'Mettre à jour le mot de passe'}</button>
          </form>
        </section>

        <section className="card">
          <h2>Compte</h2>
          <dl className="profile-dl">
            <dt>Identifiant</dt><dd>{profil?.email || '…'}</dd>
            <dt>Rôle</dt><dd>{ROLE_LABEL[user.role]}</dd>
            {user.role === 'TECHNICIEN' && (<><dt>Spécialités</dt><dd>{profil?.categories?.join(', ') || '—'}</dd></>)}
            <dt>{user.role === 'ETUDIANT' ? 'Premier signalement' : 'Plus ancien ticket'}</dt>
            <dd>{s?.premierTicket ? formatDate(s.premierTicket) : '—'}</dd>
          </dl>
          <div className="session-box">
            <div>
              <b>Session</b>
              <small>Votre session expire automatiquement après 8 heures.</small>
            </div>
            <button className="btn" onClick={onLogout}><Logout size={16} /> Se déconnecter</button>
          </div>
        </section>
      </div>
    </>
  );
}
