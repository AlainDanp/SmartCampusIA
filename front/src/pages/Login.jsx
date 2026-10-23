import { useState } from 'react';
import { api, saveSession } from '../api.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';

const COMPTES_DEMO = [
  ['lea@campus.fr', 'Léa', 'Étudiante'],
  ['tom@campus.fr', 'Tom', 'Étudiant'],
  ['karim@campus.fr', 'Karim', 'Technicien'],
  ['sophie@campus.fr', 'Sophie', 'Administration'],
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
      saveSession(token, user);
      onLogin(user);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <main className="login-layout">
        <section className="login-intro" aria-labelledby="login-product-title">
          <Logo light />
          <div className="login-intro-copy">
            <p className="eyebrow">Campus services</p>
            <h1 id="login-product-title">Le campus, plus simple.</h1>
            <p>Signalez un incident, suivez sa résolution et restez connecté aux services de votre école.</p>
          </div>
          <p className="login-campus-list">Paris · Ivry-sur-Seine · Laval · Agen</p>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-card">
            <div className="login-heading">
              <p className="eyebrow">Espace sécurisé</p>
              <h2 id="login-title">Se connecter</h2>
              <p className="muted">Utilisez vos identifiants Campus Services.</p>
            </div>

            <form onSubmit={soumettre}>
              <label htmlFor="email">
                Adresse e-mail
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@esiea.fr" required />
              </label>
              <label htmlFor="password">
                Mot de passe
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" required />
              </label>
              {erreur && <p className="error login-error" role="alert">{erreur}</p>}
              <button className="primary full-width login-submit" disabled={chargement}>
                {chargement ? 'Connexion en cours…' : 'Continuer'}
                {!chargement && <Icon name="arrow" size={17} />}
              </button>
            </form>

            <details className="demo">
              <summary>Utiliser un compte de démonstration</summary>
              <p className="muted small">Mot de passe : <code>demo1234</code></p>
              <div className="demo-accounts">
                {COMPTES_DEMO.map(([mail, nom, role]) => (
                  <button key={mail} type="button" className="demo-account" onClick={() => { setEmail(mail); setPassword('demo1234'); }}>
                    <span><strong>{nom}</strong><small>{role}</small></span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>
            </details>
          </div>
          <p className="login-help">Accès réservé aux étudiants et équipes ESIEA.</p>
        </section>
      </main>
    </div>
  );
}
