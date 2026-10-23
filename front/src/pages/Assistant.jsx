import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const ACCUEIL = { role: 'assistant', texte: "Bonjour ! Posez-moi une question sur le campus (Wi-Fi, horaires, impressions…) ou décrivez un problème." };

function chargerChat() {
  try { return JSON.parse(sessionStorage.getItem('sc_chat')) || [ACCUEIL]; } catch { return [ACCUEIL]; }
}

// US-04 (questions) et US-05 (création d'un signalement pré-rempli)
export default function Assistant() {
  const [messages, setMessages] = useState(chargerChat);
  const [saisie, setSaisie] = useState('');
  const [attente, setAttente] = useState(false);
  const fin = useRef(null);
  const navigate = useNavigate();

  // La conversation reste affichée pendant toute la session (critère US-04)
  useEffect(() => {
    try { sessionStorage.setItem('sc_chat', JSON.stringify(messages)); } catch { /* ignore */ }
    fin.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function envoyer(e) {
    e.preventDefault();
    const message = saisie.trim();
    if (!message || attente) return;
    setSaisie('');
    setMessages((m) => [...m, { role: 'user', texte: message }]);
    setAttente(true);
    try {
      const r = await api('/assistant/chat', { method: 'POST', body: { message } });
      setMessages((m) => [...m, {
        role: 'assistant',
        texte: r.reponse,
        source: r.source,
        suggestion: r.proposerSignalement ? r.suggestion : null,
      }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', texte: `Désolé, l'assistant est indisponible (${err.message}).` }]);
    } finally {
      setAttente(false);
    }
  }

  return (
    <div className="card chat">
      <div className="row between">
        <h1>Assistant IA</h1>
        <button className="link" onClick={() => setMessages([ACCUEIL])}>Effacer</button>
      </div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <p>{m.texte}</p>
            {m.source && <p className="source">Source : {m.source.titre}</p>}
            {m.suggestion && (
              <button className="primary small"
                onClick={() => navigate('/signaler', { state: { suggestion: m.suggestion, fromAssistant: true } })}>
                Créer un signalement
              </button>
            )}
          </div>
        ))}
        {attente && <div className="bubble assistant"><p className="muted">L'assistant réfléchit…</p></div>}
        <div ref={fin} />
      </div>
      <form className="row" onSubmit={envoyer}>
        <input value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={1000}
          placeholder="Ex. : Comment je me connecte au Wi-Fi ?" />
        <button className="primary" disabled={attente || !saisie.trim()}>Envoyer</button>
      </form>
    </div>
  );
}
