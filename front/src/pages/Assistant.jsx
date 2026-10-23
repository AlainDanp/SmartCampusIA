import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';

const ACCUEIL = { role: 'assistant', texte: 'Bonjour ! Je peux vous aider à trouver une information sur le campus ou à qualifier un problème avant votre signalement.' };
function chargerChat() { try { return JSON.parse(sessionStorage.getItem('sc_chat')) || [ACCUEIL]; } catch { return [ACCUEIL]; } }

export default function Assistant() {
  const [messages, setMessages] = useState(chargerChat);
  const [saisie, setSaisie] = useState('');
  const [attente, setAttente] = useState(false);
  const fin = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try { sessionStorage.setItem('sc_chat', JSON.stringify(messages)); } catch { /* stockage indisponible */ }
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    fin.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
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
      setMessages((m) => [...m, { role: 'assistant', texte: r.reponse, source: r.source, suggestion: r.proposerSignalement ? r.suggestion : null }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', texte: `L’assistant est momentanément indisponible (${err.message}).` }]);
    } finally {
      setAttente(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Espace étudiant"
        title="Assistant campus"
        description="Obtenez une réponse rapide ou préparez un signalement avec les bonnes informations."
        actions={<button type="button" className="button" onClick={() => setMessages([ACCUEIL])}>Effacer la conversation</button>}
      />
      <section className="card chat">
        <div className="chat-heading">
          <span className="assistant-orb" aria-hidden="true"><Icon name="assistant" size={19} /></span>
          <div><h2>Assistant ESIEA</h2><p><span className="online-dot" /> Disponible pour vous guider</p></div>
        </div>
        <div className="messages" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <p>{m.texte}</p>
              {m.source && <p className="source">Source : {m.source.titre}</p>}
              {m.suggestion && (
                <div className="suggestion-card">
                  <strong>Prêt à signaler ce problème ?</strong>
                  <span>Vos informations seront pré-remplies pour validation.</span>
                  <button type="button" className="primary small" onClick={() => navigate('/signaler', { state: { suggestion: m.suggestion, fromAssistant: true } })}>Créer un signalement</button>
                </div>
              )}
            </div>
          ))}
          {attente && (
            <div className="bubble assistant typing" role="status">
              <span className="visually-hidden">L’assistant rédige une réponse…</span>
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </div>
          )}
          <div ref={fin} />
        </div>
        <form className="chat-form" onSubmit={envoyer}>
          <input value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={1000} placeholder="Écrivez votre question ou décrivez votre problème…" aria-label="Votre message" />
          <button className="primary" disabled={attente || !saisie.trim()}>Envoyer <span aria-hidden="true">↑</span></button>
        </form>
      </section>
    </div>
  );
}
