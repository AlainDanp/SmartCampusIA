import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from './api.js';
import Navbar from './components/Navbar.jsx';
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
  const location = useLocation();

  const deconnexion = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const pleinEcran = location.pathname === '/login' || location.pathname === '/assistant';

  return (
    <div className="app">
      {user && <Navbar user={user} menus={MENUS[user.role]} onLogout={deconnexion} />}

      {/* La clé sur le chemin rejoue l'animation d'entrée à chaque changement de page */}
      <main key={location.pathname} className={`page-transition ${pleinEcran ? 'page-full' : 'page'}`}>
        <Routes location={location}>
          <Route path="/login" element={user ? <Navigate to={ACCUEIL[user.role]} replace /> : <Login onLogin={(u) => { setUser(u); navigate(ACCUEIL[u.role]); }} />} />
          <Route path="/signaler" element={<Protege user={user} roles={['ETUDIANT']}><Signaler /></Protege>} />
          <Route path="/mes-demandes" element={<Protege user={user} roles={['ETUDIANT']}><MesDemandes user={user} /></Protege>} />
          <Route path="/assistant" element={<Protege user={user} roles={['ETUDIANT']}><Assistant user={user} /></Protege>} />
          <Route path="/tickets/:id" element={<Protege user={user}><DetailTicket user={user} /></Protege>} />
          <Route path="/ma-file" element={<Protege user={user} roles={['TECHNICIEN', 'ADMIN']}><MaFile user={user} /></Protege>} />
          <Route path="/dashboard" element={<Protege user={user} roles={['ADMIN']}><Dashboard user={user} /></Protege>} />
          <Route path="*" element={<Navigate to={user ? ACCUEIL[user.role] : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}
