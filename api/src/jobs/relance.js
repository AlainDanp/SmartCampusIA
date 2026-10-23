// RG-06 : tâche planifiée dans le processus Node (« tâche 24 h » de l'architecture).
// Toutes les RELANCE_INTERVAL_MIN minutes, chaque ticket encore « Nouveau » après 24 h reçoit
// UNE relance automatique, visible par l'étudiant dans l'historique (SES = hors MVP).
const { query } = require('../db');

const MESSAGE = 'Relance automatique : aucune prise en charge sous 24 h. Le service technique a été relancé.';

async function relancer() {
  const { rows } = await query(
    `WITH relances AS (
       UPDATE ticket SET relance_24h = now()
       WHERE statut = 'NOUVEAU' AND relance_24h IS NULL AND date_creation < now() - interval '24 hours'
       RETURNING id, numero
     )
     INSERT INTO historique (ticket_id, auteur_id, ancien_statut, nouveau_statut, commentaire)
     SELECT id, NULL, 'NOUVEAU', 'NOUVEAU', $1 FROM relances
     RETURNING ticket_id`,
    [MESSAGE],
  );
  if (rows.length) console.warn(`[RG-06] ${rows.length} ticket(s) relancé(s) après 24 h sans prise en charge`);
  return rows.length;
}

function demarrer() {
  const minutes = Number(process.env.RELANCE_INTERVAL_MIN || 15);
  const tick = () => relancer().catch((err) => console.error('[RG-06] échec de la relance :', err.message));
  tick();
  return setInterval(tick, minutes * 60 * 1000).unref();
}

module.exports = { relancer, demarrer, MESSAGE };
