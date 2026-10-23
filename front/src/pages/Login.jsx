import { useState } from 'react';
import { api, saveSession } from '../api.js';

const COMPTES_DEMO = [
  ['lea@campus.fr', 'Léa — étudiante'],
  ['tom@campus.fr', 'Tom — étudiant'],
  ['karim@campus.fr', 'Karim — technicien'],
  ['sophie@campus.fr', 'Sophie — admin'],
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
    <div className="card narrow">
      <h1>SmartCampus <b>AI</b></h1>
      <p className="muted">Signalez, suivez et pilotez les incidents du campus.</p>
      <form onSubmit={soumettre}>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {erreur && <p className="error">{erreur}</p>}
        <button className="primary" disabled={chargement}>{chargement ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <div className="demo">
        <p className="muted">Comptes de démo (mot de passe <code>demo1234</code>) :</p>
        {COMPTES_DEMO.map(([mail, label]) => (
          <button key={mail} type="button" className="chip" onClick={() => { setEmail(mail); setPassword('demo1234'); }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
