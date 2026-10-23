import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, STATUTS } from '../api.js';
import { BarList, Donut, useCountUp } from '../components/Charts.jsx';
import { Alert, Ticket, Wrench, Hourglass, Clock, Pin, Grid, ArrowRight } from '../components/Icons.jsx';

const PERIODES = [['semaine', '7 jours'], ['mois', '30 jours'], ['semestre', 'Semestre']];
const COULEURS_STATUT = { NOUVEAU: 'var(--c-nouveau)', EN_COURS: 'var(--c-encours)', RESOLU: 'var(--c-resolu)' };

function Kpi({ icone: Icone, ton, libelle, valeur, suffixe = '', decimales = 0, detail }) {
  const anime = useCountUp(valeur ?? 0);
  return (
    <div className={`card kpi kpi-${ton}`}>
      <span className="kpi-icon"><Icone size={20} /></span>
      <span className="kpi-label">{libelle}</span>
      <b className="kpi-value">
        {valeur == null ? '—' : `${anime.toFixed(decimales).replace('.', ',')}${suffixe}`}
      </b>
      {detail && <small className="kpi-detail">{detail}</small>}
    </div>
  );
}

function Squelette() {
  return (
    <>
      <div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="card kpi skeleton" />)}</div>
      <div className="dash-grid">
        <div className="card skeleton tall" />
        <div className="card skeleton tall" />
      </div>
    </>
  );
}

// US-06 : tableau de bord de l'administration (RG-11, RG-12, alertes RG-03, retards RG-06)
export default function Dashboard({ user }) {
  const [periode, setPeriode] = useState('mois');
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setStats(null);
    setErreur('');
    api(`/stats?periode=${periode}`).then(setStats).catch((e) => setErreur(e.message));
  }, [periode]);

  const index = PERIODES.findIndex(([v]) => v === periode);
  const nonResolus = stats?.parStatut.filter((s) => s.label !== 'RESOLU').reduce((a, s) => a + s.n, 0) ?? 0;
  const prenom = user?.nom?.split(' ')[0];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <p className="eyebrow">Pilotage du campus</p>
          <h1>Bonjour {prenom}</h1>
          <p className="page-subtitle">Vue d'ensemble des incidents signalés sur la période.</p>
        </div>
        <div className="segmented" role="tablist" style={{ '--n': PERIODES.length, '--i': index }}>
          <span className="segmented-thumb" />
          {PERIODES.map(([v, label]) => (
            <button key={v} role="tab" aria-selected={periode === v} className={periode === v ? 'on' : ''} onClick={() => setPeriode(v)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {erreur && <div className="card form-error">{erreur}</div>}
      {!stats && !erreur && <Squelette />}

      {stats && stats.alertesCritiques.length > 0 && (
        <div className="alert-banner">
          <span className="alert-icon"><Alert size={20} /></span>
          <div className="alert-body">
            <b>{stats.alertesCritiques.length} incident{stats.alertesCritiques.length > 1 ? 's' : ''} critique{stats.alertesCritiques.length > 1 ? 's' : ''} non résolu{stats.alertesCritiques.length > 1 ? 's' : ''}</b>
            <div className="alert-items">
              {stats.alertesCritiques.map((a) => (
                <Link key={a.id} to={`/tickets/${a.id}`} className="alert-item">
                  <span className="mono">{a.numero}</span> {a.categorie} · {a.lieu}
                  <small>{STATUTS[a.statut]} · {formatDate(a.dateCreation)}</small>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="kpis">
            <Kpi icone={Ticket} ton="accent" libelle="Tickets sur la période" valeur={stats.total} detail={`${stats.ticketsResolus} résolu${stats.ticketsResolus > 1 ? 's' : ''}`} />
            <Kpi icone={Wrench} ton="amber" libelle="Non résolus" valeur={nonResolus} detail="Nouveaux + en cours" />
            <Kpi icone={Hourglass} ton={stats.enRetard ? 'red' : 'green'} libelle="En retard" valeur={stats.enRetard} detail="> 24 h sans prise en charge" />
            <Kpi icone={Clock} ton="blue" libelle="Délai moyen de résolution" valeur={stats.delaiMoyenHeures} suffixe=" h" decimales={1} detail="Tickets résolus uniquement" />
          </div>

          {stats.total === 0 ? (
            <div className="card empty-state">
              <Grid size={28} />
              <p>Aucun incident sur la période.</p>
            </div>
          ) : (
            <div className="dash-grid">
              <section className="card chart-card">
                <h3>Répartition par statut</h3>
                <Donut
                  total={stats.total}
                  data={stats.parStatut.map((s) => ({ label: STATUTS[s.label], n: s.n, couleur: COULEURS_STATUT[s.label] }))}
                />
              </section>
              <section className="card chart-card">
                <h3>Par catégorie</h3>
                <BarList data={stats.parCategorie} />
              </section>
              <section className="card chart-card span-2">
                <h3><Pin size={16} /> Lieux les plus touchés</h3>
                <BarList data={stats.parLieu} couleur="var(--c-lieu)" />
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
