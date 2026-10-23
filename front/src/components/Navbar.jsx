import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Spark, Logout, Menu, Close } from './Icons.jsx';

const ROLE_LABEL = { ETUDIANT: 'Étudiant', TECHNICIEN: 'Technicien', ADMIN: 'Administration' };

const initiales = (nom = '') => nom.split(' ').map((m) => m[0]).join('').slice(0, 2).toUpperCase();

// Barre de navigation : liens centrés avec un indicateur animé qui glisse sous l'onglet actif.
export default function Navbar({ user, menus, onLogout }) {
  const location = useLocation();
  const navRef = useRef(null);
  const [indicateur, setIndicateur] = useState({ left: 0, width: 0, visible: false });
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);

  // Positionne l'indicateur sous le lien actif (et le recalcule au redimensionnement)
  useLayoutEffect(() => {
    const placer = () => {
      const actif = navRef.current?.querySelector('a.active');
      if (actif) setIndicateur({ left: actif.offsetLeft, width: actif.offsetWidth, visible: true });
      else setIndicateur((i) => ({ ...i, visible: false }));
    };
    placer();
    window.addEventListener('resize', placer);
    return () => window.removeEventListener('resize', placer);
  }, [location.pathname, menus]);

  // Ombre de la barre dès que la page défile ; fermeture du menu mobile à chaque navigation
  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOuvert(false), [location.pathname]);

  return (
    <header className={`navbar ${defile ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <div className="nav-brand">
          <span className="logo-mark"><Spark size={16} /></span>
          <span className="brand-text">SmartCampus <b>AI</b></span>
        </div>

        <nav className="nav-links" ref={navRef} aria-label="Navigation principale">
          <span
            className="nav-indicator"
            style={{
              transform: `translateX(${indicateur.left}px)`,
              width: indicateur.width,
              opacity: indicateur.visible ? 1 : 0,
            }}
          />
          {menus.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>

        <div className="nav-user">
          <div className="user-chip">
            <span className={`avatar role-${user.role}`}>{initiales(user.nom)}</span>
            <span className="user-meta">
              <span className="user-name">{user.nom}</span>
              <span className="user-role">{ROLE_LABEL[user.role]}</span>
            </span>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Déconnexion" aria-label="Déconnexion">
            <Logout />
          </button>
          <button className="icon-btn burger" onClick={() => setOuvert((o) => !o)} aria-label="Menu" aria-expanded={ouvert}>
            {ouvert ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Menu mobile animé */}
      <div className={`mobile-menu ${ouvert ? 'open' : ''}`}>
        {menus.map(([to, label], i) => (
          <NavLink key={to} to={to} style={{ transitionDelay: ouvert ? `${60 + i * 40}ms` : '0ms' }}>
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
