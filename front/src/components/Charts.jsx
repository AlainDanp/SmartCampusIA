import { useEffect, useState } from 'react';

// Petits graphiques en SVG/CSS, animés à l'apparition — aucune librairie externe.

function useMonte() {
  const [monte, setMonte] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMonte(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return monte;
}

// Anime un nombre de 0 jusqu'à sa valeur
export function useCountUp(valeur, duree = 900) {
  const [affiche, setAffiche] = useState(0);
  useEffect(() => {
    if (valeur == null || Number.isNaN(Number(valeur))) return undefined;
    const cible = Number(valeur);
    const debut = performance.now();
    let frame;
    const tick = (t) => {
      const p = Math.min(1, (t - debut) / duree);
      const ease = 1 - (1 - p) ** 3;
      setAffiche(cible * ease);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [valeur, duree]);
  return affiche;
}

// Barres horizontales classées
export function BarList({ data, couleur = 'var(--accent)' }) {
  const monte = useMonte();
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <ul className="barlist">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="barlist-head">
            <span className="barlist-label">{d.label}</span>
            <span className="barlist-value">{d.n}</span>
          </div>
          <div className="barlist-track">
            <div
              className="barlist-fill"
              style={{
                width: monte ? `${(d.n / max) * 100}%` : 0,
                background: couleur,
                transitionDelay: `${i * 70}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Anneau (donut) avec légende
export function Donut({ data, total, libelleCentre = 'tickets' }) {
  const monte = useMonte();
  const R = 52;
  const C = 2 * Math.PI * R;
  const somme = data.reduce((a, d) => a + d.n, 0) || 1;
  let cumul = 0;

  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" className="donut-svg" role="img" aria-label="Répartition">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--track)" strokeWidth="16" />
        {data.map((d) => {
          const longueur = (d.n / somme) * C;
          const decalage = -cumul;
          cumul += longueur;
          return (
            <circle
              key={d.label}
              cx="70" cy="70" r={R} fill="none"
              stroke={d.couleur}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={monte ? `${Math.max(0, longueur - 2)} ${C}` : `0 ${C}`}
              strokeDashoffset={decalage}
              transform="rotate(-90 70 70)"
              className="donut-seg"
            />
          );
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-total">{total}</text>
        <text x="70" y="88" textAnchor="middle" className="donut-caption">{libelleCentre}</text>
      </svg>
      <ul className="legend">
        {data.map((d) => (
          <li key={d.label}>
            <span className="legend-dot" style={{ background: d.couleur }} />
            <span className="legend-label">{d.label}</span>
            <span className="legend-value">{d.n}</span>
            <span className="legend-pct">{Math.round((d.n / somme) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
