const router = require('express').Router();
const { query } = require('../db');

// RG-12 : route montée derrière requireRole('ADMIN') ; données agrégées uniquement.
const PERIODES = { semaine: '7 days', mois: '30 days', semestre: '182 days' };

// GET /api/stats?periode=semaine|mois|semestre  (US-06)
router.get('/', async (req, res, next) => {
  try {
    const periode = PERIODES[req.query.periode] ? req.query.periode : 'mois';
    const p = [PERIODES[periode]];
    const DANS_PERIODE = 't.date_creation >= now() - $1::interval';

    const [total, parStatut, parCategorie, parLieu, delai, alertes, retard] = await Promise.all([
      query(`SELECT count(*)::int AS n FROM ticket t WHERE ${DANS_PERIODE}`, p),
      query(`SELECT t.statut AS label, count(*)::int AS n FROM ticket t
             WHERE ${DANS_PERIODE} GROUP BY t.statut ORDER BY t.statut`, p),
      query(`SELECT c.libelle AS label, count(*)::int AS n FROM ticket t JOIN categorie c ON c.id = t.categorie_id
             WHERE ${DANS_PERIODE} GROUP BY c.libelle ORDER BY n DESC`, p),
      query(`SELECT l.batiment || ' · ' || l.salle AS label, count(*)::int AS n FROM ticket t JOIN lieu l ON l.id = t.lieu_id
             WHERE ${DANS_PERIODE} GROUP BY 1 ORDER BY n DESC LIMIT 8`, p),
      // RG-11 : délai = résolution − création, sur les tickets résolus uniquement
      query(`SELECT round((avg(extract(epoch FROM t.date_resolution - t.date_creation)) / 3600)::numeric, 1)::float AS heures,
                    count(*)::int AS n
             FROM ticket t WHERE t.statut = 'RESOLU' AND ${DANS_PERIODE}`, p),
      // RG-03 : incidents critiques non résolus (toutes périodes) — sans nom d'étudiant
      query(`SELECT t.id, t.numero, t.statut, c.libelle AS categorie, l.batiment || ' · ' || l.salle AS lieu,
                    t.date_creation AS "dateCreation"
             FROM ticket t JOIN categorie c ON c.id = t.categorie_id JOIN lieu l ON l.id = t.lieu_id
             WHERE t.priorite = 'CRITIQUE' AND t.statut <> 'RESOLU' ORDER BY t.date_creation`),
      // RG-06 : tickets sans prise en charge depuis plus de 24 h (toutes périodes)
      query(`SELECT count(*)::int AS n FROM ticket t WHERE t.statut = 'NOUVEAU' AND t.date_creation < now() - interval '24 hours'`),
    ]);

    res.json({
      periode,
      total: total.rows[0].n,
      parStatut: parStatut.rows,
      parCategorie: parCategorie.rows,
      parLieu: parLieu.rows,
      delaiMoyenHeures: delai.rows[0].heures,
      ticketsResolus: delai.rows[0].n,
      alertesCritiques: alertes.rows,
      enRetard: retard.rows[0].n,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
