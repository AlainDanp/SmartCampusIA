import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { getUser, logout } from './api.js';
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
    ['/signaler', 'Signaler'],
    ['/mes-demandes', 'Mes demandes'],
    ['/assistant', 'Assistant IA'],
  ],
  TECHNICIEN: [['/ma-file', 'Ma file']],
  ADMIN: [
    ['/dashboard', 'Tableau de bord'],
    ['/ma-file', 'Tous les tickets'],
  ],
};

// Garde de route : connecté + rôle autorisé
function Protege({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ACCUEIL[user.role]} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const deconnexion = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app">
      {user && (
        <header className="topbar">
          <span className="brand">SmartCampus <b>AI</b></span>
          <nav>
            {MENUS[user.role].map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </nav>
          <span className="who">
            {user.nom} · <small>{user.role.toLowerCase()}</small>
            <button className="link" onClick={deconnexion}>Déconnexion</button>
          </span>
        </header>
      )}

      <main className="page">
        <Routes>
          <Route path="/login" element={<Login onLogin={(u) => { setUser(u); navigate(ACCUEIL[u.role]); }} />} />
          <Route path="/signaler" element={<Protege user={user} roles={['ETUDIANT']}><Signaler /></Protege>} />
          <Route path="/mes-demandes" element={<Protege user={user} roles={['ETUDIANT']}><MesDemandes /></Protege>} />
          <Route path="/assistant" element={<Protege user={user} roles={['ETUDIANT']}><Assistant /></Protege>} />
          <Route path="/tickets/:id" element={<Protege user={user}><DetailTicket user={user} /></Protege>} />
          <Route path="/ma-file" element={<Protege user={user} roles={['TECHNICIEN', 'ADMIN']}><MaFile user={user} /></Protege>} />
          <Route path="/dashboard" element={<Protege user={user} roles={['ADMIN']}><Dashboard /></Protege>} />
          <Route path="*" element={<Navigate to={user ? ACCUEIL[user.role] : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}
