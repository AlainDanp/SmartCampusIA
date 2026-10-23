import { useState } from 'react';
import { api, saveSession } from '../api.js';
import { Spark, Mail, Lock, Eye, EyeOff, ArrowRight, Ticket, Chat, Grid } from '../components/Icons.jsx';

const COMPTES_DEMO = [
  { email: 'lea@campus.fr', nom: 'Léa Martin', role: 'Étudiante', code: 'ETUDIANT' },
  { email: 'tom@campus.fr', nom: 'Tom Bernard', role: 'Étudiant', code: 'ETUDIANT' },
  { email: 'karim@campus.fr', nom: 'Karim Haddad', role: 'Technicien', code: 'TECHNICIEN' },
  { email: 'sophie@campus.fr', nom: 'Sophie Laurent', role: 'Administration', code: 'ADMIN' },
];

const ATOUTS = [
  { icone: Ticket, titre: 'Signalez en 30 secondes', texte: 'Depuis votre téléphone, avec photo et lieu précis.' },
  { icone: Chat, titre: 'Un assistant IA 24h/24', texte: 'Des réponses immédiates aux questions du quotidien.' },
  { icone: Grid, titre: 'Un campus piloté', texte: 'Des indicateurs clairs pour décider où agir.' },
];

const initiales = (nom) => nom.split(' ').map((m) => m[0]).join('');

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(null); // 'form' | email du compte démo
  const [secousse, setSecousse] = useState(0);

  async function connecter(mail, mdp, source) {
    setErreur('');
    setChargement(source);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email: mail, password: mdp } });
      saveSession(token, user);
      onLogin(user);
    } catch (err) {
      setErreur(err.message);
      setSecousse((n) => n + 1);
      setChargement(null);
    }
  }

  const soumettre = (e) => {
    e.preventDefault();
    connecter(email, password, 'form');
  };

  return (
    <div className="login">
      <aside className="login-hero">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="hero-content">
          <div className="hero-brand">
            <span className="logo-mark light"><Spark size={18} /></span>
            SmartCampus <b>AI</b>
          </div>
          <h2 className="hero-title">Le campus qui répond,<br />du signalement à la résolution.</h2>
          <ul className="hero-list">
            {ATOUTS.map(({ icone: Icone, titre, texte }, i) => (
              <li key={titre} style={{ animationDelay: `${200 + i * 120}ms` }}>
                <span className="hero-icon"><Icone /></span>
                <span><b>{titre}</b><small>{texte}</small></span>
              </li>
            ))}
          </ul>
          <p className="hero-foot">Ateliers ESIEA × Capgemini · 2026</p>
        </div>
      </aside>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <span className="logo-mark"><Spark size={16} /></span> SmartCampus <b>AI</b>
          </div>
          <h1>Connexion</h1>
          <p className="muted">Accédez à votre espace avec votre compte école.</p>

          <form onSubmit={soumettre} key={secousse} className={secousse ? 'shake' : ''}>
            <label className="field">
              <span className="field-label">Email</span>
              <span className="input-icon">
                <Mail />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom@campus.fr" autoComplete="username" required />
              </span>
            </label>
            <label className="field">
              <span className="field-label">Mot de passe</span>
              <span className="input-icon">
                <Lock />
                <input type={voirMdp ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" className="input-toggle" onClick={() => setVoirMdp((v) => !v)}
                  aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                  {voirMdp ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>

            {erreur && <p className="form-error" role="alert">{erreur}</p>}

            <button className="btn btn-primary btn-block" disabled={!!chargement}>
              {chargement === 'form' ? <span className="spinner" /> : <>Se connecter <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="divider"><span>ou essayez un compte de démo</span></div>

          <div className="demo-grid">
            {COMPTES_DEMO.map((c) => (
              <button key={c.email} type="button" className="demo-card" disabled={!!chargement}
                onClick={() => connecter(c.email, 'demo1234', c.email)}>
                <span className={`avatar role-${c.code}`}>{initiales(c.nom)}</span>
                <span className="demo-meta">
                  <b>{c.nom.split(' ')[0]}</b>
                  <small>{c.role}</small>
                </span>
                {chargement === c.email ? <span className="spinner dark" /> : <ArrowRight size={15} className="demo-arrow" />}
              </button>
            ))}
          </div>
          <p className="demo-note">Mot de passe des comptes de démo : <code>demo1234</code></p>
        </div>
      </section>
    </div>
  );
}
