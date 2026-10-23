const router = require('express').Router();
const { query } = require('../db');

// GET /api/referentiels → catégories et lieux pour le formulaire de signalement
router.get('/', async (req, res, next) => {
  try {
    const [categories, lieux] = await Promise.all([
      query('SELECT id, libelle, priorite_defaut AS "prioriteDefaut" FROM categorie ORDER BY libelle'),
      query('SELECT id, batiment, salle FROM lieu ORDER BY batiment, salle'),
    ]);
    res.json({ categories: categories.rows, lieux: lieux.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
