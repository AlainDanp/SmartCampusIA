const router = require('express').Router();
const { query } = require('../db');
const { hashPassword, verifyPassword } = require('../middleware/auth');

// GET /api/profil → informations du compte + statistiques selon le rôle
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, nom, email, role FROM utilisateur WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Compte introuvable' });

    // Périmètre des statistiques : ses tickets (étudiant), ses tickets assignés (technicien), tout le campus (admin)
    let filtre = '';
    const params = [];
    if (user.role === 'ETUDIANT') { filtre = 'WHERE t.auteur_id = $1'; params.push(user.id); }
    if (user.role === 'TECHNICIEN') { filtre = 'WHERE t.technicien_id = $1'; params.push(user.id); }

    const [stats, categories] = await Promise.all([
      query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE t.statut = 'NOUVEAU')::int  AS nouveaux,
                count(*) FILTER (WHERE t.statut = 'EN_COURS')::int AS "enCours",
                count(*) FILTER (WHERE t.statut = 'RESOLU')::int   AS resolus,
                round((avg(extract(epoch FROM t.date_resolution - t.date_creation)) / 3600)::numeric, 1)::float AS "delaiMoyenHeures",
                min(t.date_creation) AS "premierTicket"
         FROM ticket t ${filtre}`,
        params,
      ),
      // Catégories gérées par le technicien (RG-13)
      user.role === 'TECHNICIEN'
        ? query('SELECT libelle FROM categorie WHERE technicien_id = $1 ORDER BY libelle', [user.id])
        : Promise.resolve({ rows: [] }),
    ]);

    return res.json({ ...user, stats: stats.rows[0], categories: categories.rows.map((c) => c.libelle) });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/profil/mot-de-passe  { actuel, nouveau }
router.patch('/mot-de-passe', async (req, res, next) => {
  try {
    const { actuel, nouveau } = req.body || {};
    if (!actuel || !nouveau) {
      return res.status(400).json({ error: 'Les deux mots de passe sont obligatoires' });
    }
    if (String(nouveau).length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères', champs: { nouveau: 'Au moins 8 caractères' } });
    }
    if (actuel === nouveau) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'actuel", champs: { nouveau: 'Identique à l’actuel' } });
    }

    const { rows } = await query('SELECT mot_de_passe FROM utilisateur WHERE id = $1', [req.user.id]);
    if (!rows[0] || !verifyPassword(actuel, rows[0].mot_de_passe)) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect', champs: { actuel: 'Mot de passe incorrect' } });
    }

    await query('UPDATE utilisateur SET mot_de_passe = $2 WHERE id = $1', [req.user.id, hashPassword(nouveau)]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
