import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, formatDate, STATUTS } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';

const PERIODES = [['semaine', 'Semaine'], ['mois', 'Mois'], ['semestre', 'Semestre']];

function Graphique({ titre, data, horizontal }) {
  return (
    <section className="card chart-card">
      <div className="chart-title"><h2>{titre}</h2><span>Volume de tickets</span></div>
      <ResponsiveContainer width="100%" height={horizontal ? 280 : 240}>
        {horizontal ? (
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 30, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={135} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="n" name="Tickets" fill="#19a7d9" radius={[0, 6, 6, 0]} />
          </BarChart>
        ) : (
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="n" name="Tickets" fill="#19a7d9" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <ul className="visually-hidden">
        {data.map((item) => <li key={item.label}>{item.label} : {item.n} ticket{item.n > 1 ? 's' : ''}</li>)}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  const [periode, setPeriode] = useState('mois');
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setStats(null);
    setErreur('');
    api(`/stats?periode=${periode}`).then(setStats).catch((e) => setErreur(e.message));
  }, [periode]);

  const nonResolus = stats?.parStatut.filter((s) => s.label !== 'RESOLU').reduce((a, s) => a + s.n, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Pilotage du campus"
        description="Suivez les indicateurs clés et anticipez les besoins d’intervention."
        actions={(
          <div className="filters period-filters" role="group" aria-label="Période d’analyse">
            {PERIODES.map(([v, label]) => (
              <button key={v} type="button" className={`chip ${periode === v ? 'active' : ''}`} aria-pressed={periode === v} onClick={() => setPeriode(v)}>{label}</button>
            ))}
          </div>
        )}
      />
      {erreur && <p className="error" role="alert">{erreur}</p>}
      {!stats && !erreur && <p className="loading-state" role="status">Mise à jour des indicateurs…</p>}
      {stats?.alertesCritiques.length > 0 && (
        <section className="alert">
          <div><p className="eyebrow">Vigilance</p><h2>{stats.alertesCritiques.length} incident{stats.alertesCritiques.length > 1 ? 's' : ''} critique{stats.alertesCritiques.length > 1 ? 's' : ''} à traiter</h2><p>Ces tickets nécessitent une attention immédiate.</p></div>
          <ul>{stats.alertesCritiques.map((a) => <li key={a.id}><Link to={`/tickets/${a.id}`}>{a.numero}</Link><span>{a.categorie} · {a.lieu} · {STATUTS[a.statut]} depuis le {formatDate(a.dateCreation)}</span></li>)}</ul>
        </section>
      )}
      {stats?.total === 0 && <div className="card empty-state"><span aria-hidden="true"><Icon name="dashboard" /></span><h3>Aucun incident sur cette période</h3><p>Les indicateurs apparaîtront dès qu’un signalement sera créé.</p></div>}
      {stats && stats.total > 0 && (
        <>
          <section className="kpis" aria-label="Indicateurs clés">
            <div className="card kpi"><span>Tickets reçus</span><b>{stats.total}</b><small>sur la période sélectionnée</small></div>
            <div className="card kpi"><span>À résoudre</span><b>{nonResolus}</b><small>tickets non clôturés</small></div>
            <div className="card kpi"><span>En retard</span><b className={stats.enRetard ? 'rouge' : ''}>{stats.enRetard}</b><small>sans prise en charge &gt; 24 h</small></div>
            <div className="card kpi"><span>Délai moyen</span><b>{stats.delaiMoyenHeures != null ? `${stats.delaiMoyenHeures} h` : '—'}</b><small>sur {stats.ticketsResolus} ticket(s) résolu(s)</small></div>
          </section>
          <div className="dashboard-grid">
            <Graphique titre="Répartition par catégorie" data={stats.parCategorie} horizontal />
            <Graphique titre="Répartition par lieu" data={stats.parLieu} horizontal />
          </div>
          <Graphique titre="Avancement des tickets" data={stats.parStatut.map((s) => ({ ...s, label: STATUTS[s.label] }))} />
        </>
      )}
    </div>
  );
}
