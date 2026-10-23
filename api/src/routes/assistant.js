const router = require('express').Router();
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const assistant = require('../services/assistant');

// POST /api/assistant/chat  { message }  (US-04 / US-05)
// RG-09 : pas d'invention hors FAQ — RG-10 : aucun ticket créé ici, seulement une suggestion.
router.post('/chat', requireRole('ETUDIANT'), async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Le message est vide' });
    if (message.length > 1000) return res.status(400).json({ error: 'Message trop long (1000 caractères max)' });

    const [categories, lieux] = await Promise.all([
      query('SELECT id, libelle FROM categorie'),
      query('SELECT id, batiment, salle FROM lieu'),
    ]);
    const debut = Date.now();
    const resultat = await assistant.repondre(message, { categories: categories.rows, lieux: lieux.rows });
    return res.json({ ...resultat, dureeMs: Date.now() - debut });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
