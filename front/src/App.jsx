import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { getUser, logout } from './api.js';
import Logo from './components/Logo.jsx';
import Icon from './components/Icon.jsx';
import Login from './pages/Login.jsx';
import Signaler from './pages/Signaler.jsx';
import MesDemandes from './pages/MesDemandes.jsx';
import DetailTicket from './pages/DetailTicket.jsx';
import MaFile from './pages/MaFile.jsx';
import Assistant from './pages/Assistant.jsx';
import Dashboard from './pages/Dashboard.jsx';

const ACCUEIL = { ETUDIANT: '/mes-demandes', TECHNICIEN: '/ma-file', ADMIN: '/dashboard' };

const MENUS = {
  ETUDIANT: [
    ['/signaler', 'Signaler', 'add'],
    ['/mes-demandes', 'Mes demandes', 'tickets'],
    ['/assistant', 'Assistant', 'assistant'],
  ],
  TECHNICIEN: [['/ma-file', 'Interventions', 'tickets']],
  ADMIN: [
    ['/dashboard', 'Pilotage', 'dashboard'],
    ['/ma-file', 'Tous les tickets', 'tickets'],
  ],
};

const ROLE_LABELS = { ETUDIANT: 'Étudiant·e', TECHNICIEN: 'Technicien·ne', ADMIN: 'Administration' };

function Protege({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ACCUEIL[user.role]} replace />;
  return children;
}

function MenuLinks({ user, mobile = false }) {
  return MENUS[user.role].map(([to, label, icon]) => (
    <NavLink key={to} to={to} className={mobile ? 'mobile-nav-item' : 'nav-item'}>
      <span className="nav-icon"><Icon name={icon} size={mobile ? 21 : 19} /></span>
      <span>{label}</span>
    </NavLink>
  ));
}

function AppShell({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenu-principal">Aller au contenu principal</a>
      <aside className="sidebar">
        <div className="sidebar-glow" aria-hidden="true" />
        <div className="sidebar-brand"><Logo light /></div>
        <div className="sidebar-context">Services du campus</div>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          <MenuLinks user={user} />
        </nav>
        <div className="sidebar-footer">
          <div className="user-summary">
            <span className="avatar" aria-hidden="true">{user.nom?.charAt(0)?.toUpperCase() || '?'}</span>
            <span className="user-copy"><strong>{user.nom}</strong><small>{ROLE_LABELS[user.role]}</small></span>
          </div>
          <button type="button" className="logout-button" onClick={onLogout}>
            <Icon name="logout" size={17} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <Logo compact light />
          <button type="button" className="mobile-logout" onClick={onLogout} aria-label="Se déconnecter">
            <Icon name="logout" size={20} />
          </button>
        </header>
        <main className="page" id="contenu-principal" tabIndex="-1">{children}</main>
        <footer className="app-footer">ESIEA Campus Services <span>·</span> Une expérience campus plus simple</footer>
        <nav className="mobile-nav" aria-label="Navigation principale">
          <MenuLinks user={user} mobile />
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const deconnexion = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const routes = (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={ACCUEIL[user.role]} replace /> : <Login onLogin={(u) => { setUser(u); navigate(ACCUEIL[u.role]); }} />} />
      <Route path="/signaler" element={<Protege user={user} roles={['ETUDIANT']}><Signaler /></Protege>} />
      <Route path="/mes-demandes" element={<Protege user={user} roles={['ETUDIANT']}><MesDemandes /></Protege>} />
      <Route path="/assistant" element={<Protege user={user} roles={['ETUDIANT']}><Assistant /></Protege>} />
      <Route path="/tickets/:id" element={<Protege user={user}><DetailTicket user={user} /></Protege>} />
      <Route path="/ma-file" element={<Protege user={user} roles={['TECHNICIEN', 'ADMIN']}><MaFile user={user} /></Protege>} />
      <Route path="/dashboard" element={<Protege user={user} roles={['ADMIN']}><Dashboard /></Protege>} />
      <Route path="*" element={<Navigate to={user ? ACCUEIL[user.role] : '/login'} replace />} />
    </Routes>
  );

  return user ? <AppShell user={user} onLogout={deconnexion}>{routes}</AppShell> : <main className="public-page">{routes}</main>;
}
