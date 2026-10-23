import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Spark, ArrowUp, Book, Plus, Wifi, Library, Printer, Wrench, Check, Pin } from '../components/Icons.jsx';

const SUGGESTIONS = [
  { icone: Wifi, texte: 'Comment je me connecte au Wi-Fi du campus ?' },
  { icone: Library, texte: 'Quels sont les horaires de la bibliothèque ?' },
  { icone: Printer, texte: 'Comment imprimer un document ?' },
  { icone: Wrench, texte: 'Le vidéoprojecteur de la salle B204 ne s\'allume pas' },
];

function chargerChat() {
  try {
    const sauve = JSON.parse(sessionStorage.getItem('sc_chat')) || [];
    // Compatibilité : on retire l'ancien message d'accueil automatique
    return sauve.filter((m) => !(m.role === 'assistant' && m.texte?.startsWith('Bonjour ! Posez-moi')));
  } catch {
    return [];
  }
}

// US-04 (questions) et US-05 (création d'un signalement pré-rempli) — interface inspirée de Claude
export default function Assistant({ user }) {
  const [messages, setMessages] = useState(chargerChat);
  const [saisie, setSaisie] = useState('');
  const [attente, setAttente] = useState(false);
  const fin = useRef(null);
  const zone = useRef(null);
  const navigate = useNavigate();
  const prenom = user?.nom?.split(' ')[0] || '';
  const [refs, setRefs] = useState({ categories: [], lieux: [] });
  const [creation, setCreation] = useState(null); // index du message en cours de création

  // Libellés des catégories et lieux, pour afficher le récapitulatif du signalement proposé
  useEffect(() => {
    api('/referentiels').then(setRefs).catch(() => {});
  }, []);
  const nomCategorie = (id) => refs.categories.find((c) => c.id === Number(id))?.libelle;
  const nomLieu = (id) => {
    const l = refs.lieux.find((x) => x.id === Number(id));
    return l ? `${l.batiment} · ${l.salle}` : null;
  };

  // US-05 / RG-10 : l'étudiant valide d'un clic ; le ticket est créé sans quitter la conversation
  async function creerTicket(index, suggestion) {
    setCreation(index);
    const data = new FormData();
    data.append('categorieId', suggestion.categorieId);
    data.append('lieuId', suggestion.lieuId);
    data.append('description', suggestion.description);
    try {
      const ticket = await api('/tickets', { method: 'POST', form: data });
      setMessages((m) => [
        ...m.map((msg, i) => (i === index ? { ...msg, ticketCree: ticket.numero } : msg)),
        {
          role: 'assistant',
          texte: `C'est fait : votre signalement ${ticket.numero} a été créé et transmis au service compétent. Vous pouvez suivre son avancement dans « Mes demandes ».`,
          lienTicket: ticket.id,
        },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', texte: `Le signalement n'a pas pu être créé (${err.message}). Vous pouvez compléter le formulaire.`, erreur: true }]);
    } finally {
      setCreation(null);
    }
  }

  // La conversation reste affichée pendant toute la session (critère US-04)
  useEffect(() => {
    try { sessionStorage.setItem('sc_chat', JSON.stringify(messages)); } catch { /* ignore */ }
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, attente]);

  // Zone de saisie qui s'agrandit avec le texte
  useLayoutEffect(() => {
    const el = zone.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [saisie]);

  async function envoyer(texte) {
    const message = (texte ?? saisie).trim();
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
      setMessages((m) => [...m, { role: 'assistant', texte: `Désolé, l'assistant est momentanément indisponible (${err.message}).`, erreur: true }]);
    } finally {
      setAttente(false);
      zone.current?.focus();
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      envoyer();
    }
  };

  const vide = messages.length === 0;

  return (
    <div className={`claude ${vide ? 'is-empty' : ''}`}>
      {!vide && (
        <div className="claude-topbar">
          <span className="claude-title"><Spark size={14} /> Assistant SmartCampus</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}>
            <Plus size={15} /> Nouvelle conversation
          </button>
        </div>
      )}

      <div className="claude-scroll">
        <div className="claude-column">
          {vide ? (
            <div className="claude-welcome">
              <span className="claude-star"><Spark size={34} /></span>
              <h1 className="serif">Bonjour {prenom}, comment puis-je vous aider ?</h1>
              <p className="muted">Posez une question sur la vie du campus, ou décrivez un problème : je vous aide à le signaler.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="msg msg-user"><p>{m.texte}</p></div>
              ) : (
                <div key={i} className={`msg msg-ai ${m.erreur ? 'is-error' : ''}`}>
                  <span className="ai-avatar"><Spark size={15} /></span>
                  <div className="ai-body">
                    <p className="serif">{m.texte}</p>
                    {m.source && <span className="source-pill"><Book size={13} /> {m.source.titre}</span>}
                    {m.lienTicket && (
                      <button className="btn btn-ghost btn-sm lien-ticket" onClick={() => navigate(`/tickets/${m.lienTicket}`)}>
                        Voir le ticket →
                      </button>
                    )}
                    {m.suggestion && (
                      <div className={`action-card ${m.ticketCree ? 'done' : ''}`}>
                        <div className="action-text">
                          <b>{m.ticketCree ? `Signalement ${m.ticketCree} créé` : 'Créer un signalement'}</b>
                          {m.suggestion.categorieId && m.suggestion.lieuId ? (
                            <span className="action-recap">
                              <span className="badge prio-NORMALE"><i />{nomCategorie(m.suggestion.categorieId) || 'Catégorie'}</span>
                              <span className="action-lieu"><Pin size={13} /> {nomLieu(m.suggestion.lieuId) || 'Lieu'}</span>
                            </span>
                          ) : (
                            <small>Je pré-remplis le formulaire à partir de votre message ; il vous restera à préciser la catégorie ou le lieu.</small>
                          )}
                        </div>
                        {m.ticketCree ? (
                          <span className="action-done"><Check size={18} strokeWidth={2.4} /></span>
                        ) : (
                          <div className="action-buttons">
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => navigate('/signaler', { state: { suggestion: m.suggestion, fromAssistant: true } })}>
                              {m.suggestion.categorieId && m.suggestion.lieuId ? 'Modifier' : 'Compléter le formulaire'}
                            </button>
                            {m.suggestion.categorieId && m.suggestion.lieuId && (
                              <button className="btn btn-primary btn-sm" disabled={creation !== null} onClick={() => creerTicket(i, m.suggestion)}>
                                {creation === i ? <span className="spinner" /> : 'Créer le ticket'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            ))
          )}

          {attente && (
            <div className="msg msg-ai">
              <span className="ai-avatar thinking"><Spark size={15} /></span>
              <div className="typing"><i /><i /><i /></div>
            </div>
          )}
          <div ref={fin} />
        </div>
      </div>

      <div className="claude-bottom">
        <div className="claude-column">
          <form className="composer" onSubmit={(e) => { e.preventDefault(); envoyer(); }}>
            <textarea
              ref={zone}
              rows={1}
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={1000}
              placeholder={vide ? 'Posez votre question…' : 'Répondre à l\'assistant…'}
              aria-label="Message"
              autoFocus
            />
            <div className="composer-bar">
              <span className="composer-hint">Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</span>
              <button className="send-btn" disabled={attente || !saisie.trim()} aria-label="Envoyer">
                <ArrowUp size={18} strokeWidth={2.2} />
              </button>
            </div>
          </form>

          {vide && (
            <div className="suggestions">
              {SUGGESTIONS.map(({ icone: Icone, texte }) => (
                <button key={texte} className="suggestion" onClick={() => envoyer(texte)}>
                  <Icone size={15} /> {texte}
                </button>
              ))}
            </div>
          )}
          <p className="claude-disclaimer">Réponses issues de la FAQ officielle du campus. Pour un incident, l'assistant vous propose un signalement.</p>
        </div>
      </div>
    </div>
  );
}
