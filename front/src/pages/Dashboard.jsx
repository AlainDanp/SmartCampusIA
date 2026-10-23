import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, formatDate, STATUTS } from '../api.js';

const PERIODES = [['semaine', 'Semaine'], ['mois', 'Mois'], ['semestre', 'Semestre']];

function Graphique({ titre, data, horizontal }) {
  return (
    <div className="card">
      <h3>{titre}</h3>
      <ResponsiveContainer width="100%" height={horizontal ? 280 : 240}>
        {horizontal ? (
          <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="n" name="Tickets" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="n" name="Tickets" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// US-06 : tableau de bord de l'administration (RG-11, RG-12, alertes RG-03)
export default function Dashboard() {
  const [periode, setPeriode] = useState('mois');
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setStats(null);
    api(`/stats?periode=${periode}`).then(setStats).catch((e) => setErreur(e.message));
  }, [periode]);

  return (
    <div>
      <div className="row between">
        <h1>Tableau de bord</h1>
        <div className="filters">
          {PERIODES.map(([v, label]) => (
            <button key={v} className={`chip ${periode === v ? 'active' : ''}`} onClick={() => setPeriode(v)}>{label}</button>
          ))}
        </div>
      </div>

      {erreur && <p className="error">{erreur}</p>}
      {!stats && !erreur && <p className="muted">Chargement…</p>}

      {stats?.alertesCritiques.length > 0 && (
        <div className="alert">
          <b>⚠ {stats.alertesCritiques.length} incident(s) critique(s) non résolu(s)</b>
          <ul>
            {stats.alertesCritiques.map((a) => (
              <li key={a.id}>
                <Link to={`/tickets/${a.id}`}>{a.numero}</Link> — {a.categorie}, {a.lieu} ({STATUTS[a.statut]}, signalé le {formatDate(a.dateCreation)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats && stats.total === 0 && <div className="card center"><p>Aucun incident sur la période.</p></div>}

      {stats && stats.total > 0 && (
        <>
          <div className="kpis">
            <div className="card kpi"><span>Tickets sur la période</span><b>{stats.total}</b></div>
            <div className="card kpi"><span>Non résolus</span><b>{stats.parStatut.filter((s) => s.label !== 'RESOLU').reduce((a, s) => a + s.n, 0)}</b></div>
            <div className="card kpi">
              <span>En retard (&gt; 24 h sans prise en charge)</span>
              <b className={stats.enRetard ? 'rouge' : ''}>{stats.enRetard}</b>
            </div>
            <div className="card kpi">
              <span>Délai moyen de résolution</span>
              <b>{stats.delaiMoyenHeures != null ? `${stats.delaiMoyenHeures} h` : '—'}</b>
              <small className="muted">sur {stats.ticketsResolus} ticket(s) résolu(s)</small>
            </div>
          </div>
          <div className="grid-2">
            <Graphique titre="Par catégorie" data={stats.parCategorie} horizontal />
            <Graphique titre="Par lieu" data={stats.parLieu} horizontal />
          </div>
          <Graphique titre="Par statut" data={stats.parStatut.map((s) => ({ ...s, label: STATUTS[s.label] }))} />
        </>
      )}
    </div>
  );
}
